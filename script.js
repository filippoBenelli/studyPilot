document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

  // Controlla se giorno è libero
  function hasFreeDayEvent(dateStr) {
    return calendar.getEvents().some(ev => ev.startStr === dateStr && ev.extendedProps.tipo === "libero");
  }

  // Controlla se giorno è ripasso (utile per gestione inserimenti)
  function hasRipassoEvent(dateStr) {
    return calendar.getEvents().some(ev => ev.startStr === dateStr && ev.extendedProps.tipo === "ripasso");
  }

  // Ottieni eventi di studio/ripasso di una verifica specifica in un giorno
  function hasStudioEventForVerifica(dateStr, verificaId) {
    return calendar.getEvents().some(ev =>
      ev.startStr === dateStr &&
      (ev.extendedProps.tipo === "studio" || ev.extendedProps.tipo === "ripasso") &&
      ev.extendedProps.verificaId === verificaId
    );
  }

  // Crea calendario
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    selectable: true,
    editable: true,
    dateClick: function (info) {
      const clickedDate = info.dateStr;

      // Se è giorno libero e non è ripasso, blocca aggiunte
      if (hasFreeDayEvent(clickedDate) && !hasRipassoEvent(clickedDate)) {
        alert("Questo è un giorno libero, non puoi aggiungere eventi qui.");
        return;
      }

      showChoiceDialog(clickedDate);
    },
    eventClick: function (info) {
      showEventDetailDialog(info.event);
    }
  });

  calendar.render();

  // Dialog e bottoni
  const choiceDialog = document.getElementById("choiceDialog");
  const addEventChoice = document.getElementById("addEventChoice");
  const markFreeDayChoice = document.getElementById("markFreeDayChoice");
  const cancelChoice = document.getElementById("cancelChoice");

  const contextMenu = document.getElementById("contextMenu");
  const materiaInput = document.getElementById("materia");
  const paginaInput = document.getElementById("pagina");
  const difficoltaSelect = document.getElementById("difficolta");
  const salvaDettagli = document.getElementById("salvaDettagli");
  const annullaDettagli = document.getElementById("annullaDettagli");

  const eventDetailDialog = document.getElementById("eventDetailDialog");
  const eventDetailTitle = document.getElementById("eventDetailTitle");
  const eventDetailContent = document.getElementById("eventDetailContent");
  const closeDetailDialog = document.getElementById("closeDetailDialog");
  const deleteEventFromDetail = document.getElementById("deleteEventFromDetail");

  let currentClickedDate = null;
  let eventToDelete = null;

  // Id progressivo per verifiche per distinguere eventi correlati
  let verificaIdCounter = 1;

  // Funzioni dialog
  function showChoiceDialog(dateStr) {
    currentClickedDate = dateStr;
    choiceDialog.style.display = "block";
  }
  function hideChoiceDialog() {
    choiceDialog.style.display = "none";
  }
  function showContextMenu() {
    materiaInput.value = "";
    paginaInput.value = "";
    difficoltaSelect.value = "1";
    contextMenu.style.display = "block";
  }
  function hideContextMenu() {
    contextMenu.style.display = "none";
  }
  function showEventDetailDialog(event) {
    eventToDelete = event;
    eventDetailTitle.textContent = event.title;
    let details = `<p>Data: ${event.startStr}</p><p>Tipo: ${event.extendedProps.tipo || "N/A"}</p>`;
    if (event.extendedProps.pagine) details += `<p>Pagine: ${event.extendedProps.pagine}</p>`;
    if (event.extendedProps.difficolta) details += `<p>Difficoltà: ${event.extendedProps.difficolta}</p>`;
    if (event.extendedProps.materia) details += `<p>Materia: ${event.extendedProps.materia}</p>`;
    eventDetailContent.innerHTML = details;
    eventDetailDialog.style.display = "block";
  }
  function hideEventDetailDialog() {
    eventDetailDialog.style.display = "none";
    eventToDelete = null;
  }

  // Choice dialog buttons
  addEventChoice.addEventListener("click", () => {
    hideChoiceDialog();

    if (hasFreeDayEvent(currentClickedDate) && !hasRipassoEvent(currentClickedDate)) {
      alert("Non puoi aggiungere eventi in un giorno libero.");
      return;
    }

    showContextMenu();
  });

  markFreeDayChoice.addEventListener("click", () => {
    hideChoiceDialog();

    if (calendar.getEvents().some(ev => ev.startStr === currentClickedDate && ev.extendedProps.tipo !== "ripasso")) {
      alert("Non puoi marcare giorno libero perché ci sono altri eventi.");
      return;
    }

    calendar.addEvent({
      title: "Giorno Libero",
      start: currentClickedDate,
      allDay: true,
      backgroundColor: "#28a745",
      borderColor: "#19692c",
      extendedProps: { tipo: "libero" }
    });
  });

  cancelChoice.addEventListener("click", () => {
    hideChoiceDialog();
  });

  // Context menu buttons
  salvaDettagli.addEventListener("click", () => {
    const materia = materiaInput.value.trim();
    const pagine = parseInt(paginaInput.value);
    const difficolta = difficoltaSelect.value;

    if (!materia) {
      alert("Inserisci una materia valida.");
      return;
    }
    if (isNaN(pagine) || pagine < 1) {
      alert("Inserisci un numero valido di pagine.");
      return;
    }

    // Id verifica per distinguere eventi correlati
    const verificaId = verificaIdCounter++;

    calendar.addEvent({
      id: `verifica-${verificaId}`,
      title: `Verifica: ${materia}`,
      start: currentClickedDate,
      allDay: true,
      backgroundColor: "#dc3545",
      borderColor: "#7a1a23",
      extendedProps: {
        tipo: "verifica",
        materia: materia,
        pagine: pagine,
        difficolta: difficolta,
        verificaId: verificaId
      }
    });

    hideContextMenu();

    // Calcolo piano studio considerando separatamente questa verifica
    calcolaPianoStudio(currentClickedDate, pagine, difficolta, verificaId, materia);
  });

  annullaDettagli.addEventListener("click", () => {
    hideContextMenu();
  });

  // Event detail dialog buttons
  closeDetailDialog.addEventListener("click", () => {
    hideEventDetailDialog();
  });

  deleteEventFromDetail.addEventListener("click", () => {
    if (eventToDelete) {
      if (eventToDelete.extendedProps.tipo === "verifica") {
        const verificaId = eventToDelete.extendedProps.verificaId;

        // Rimuovo studio/ripasso di questa verifica
        calendar.getEvents()
          .filter(ev => ev.extendedProps.verificaId === verificaId)
          .forEach(ev => ev.remove());
      }
      eventToDelete.remove();
      hideEventDetailDialog();
    }
  });

  // Calcolo piano studio per verifica singola
  function calcolaPianoStudio(dataVerificaStr, pagineTotali, difficolta, verificaId, materia) {
    const dataVerifica = new Date(dataVerificaStr);
    const oggi = new Date();
    oggi.setHours(0,0,0,0);

    // Giorno di ripasso = giorno prima verifica
    const giornoRipasso = new Date(dataVerifica);
    giornoRipasso.setDate(dataVerifica.getDate() - 1);
    const giornoRipassoStr = giornoRipasso.toISOString().slice(0, 10);

    // Aggiungi o conferma giorno di ripasso anche se è giorno libero
    if (!hasRipassoEvent(giornoRipassoStr)) {
      calendar.addEvent({
        title: `Ripasso ${materia}`,
        start: giornoRipassoStr,
        allDay: true,
        backgroundColor: "#ffc107",
        borderColor: "#b38600",
        extendedProps: {
          tipo: "ripasso",
          verificaId: verificaId,
          materia: materia
        }
      });
    }

    const MAX_GIORNI_STUDIO = 14; // massimo 2 settimane

    // Trovo giorni disponibili per studio (escludendo giorni liberi escluso ripasso)
    let giorniStudio = [];
    for (let i = 2; i <= MAX_GIORNI_STUDIO + 1; i++) {
      let giorno = new Date(dataVerifica);
      giorno.setDate(dataVerifica.getDate() - i);
      const giornoStr = giorno.toISOString().slice(0, 10);

      if (giornoStr === giornoRipassoStr) continue; // skip ripasso (già aggiunto)
      if (!hasFreeDayEvent(giornoStr)) giorniStudio.push(giornoStr);
    }

    // Filtra solo giorni >= oggi (non nel passato)
    giorniStudio = giorniStudio.filter(giornoStr => {
      const data = new Date(giornoStr);
      data.setHours(0,0,0,0);
      return data >= oggi;
    });

    if (giorniStudio.length === 0) {
      alert(`Non ci sono giorni disponibili per lo studio prima della verifica di ${materia}!`);
      return;
    }

    const difficoltaNum = parseInt(difficolta);
    let pagineRimanenti = pagineTotali;

    const numeroGiorni = giorniStudio.length;

    // Distribuisco pagine in modo uniforme
    let pagineBase = Math.floor(pagineRimanenti / numeroGiorni);
    if (pagineBase < 1) pagineBase = 1;

    let distribuzione = Array(numeroGiorni).fill(pagineBase);
    pagineRimanenti -= pagineBase * numeroGiorni;

    // Distribuisco pagine residue 1 a 1 ai giorni da inizio fino a esaurimento
    let index = 0;
    while (pagineRimanenti > 0) {
      distribuzione[index]++;
      pagineRimanenti--;
      index = (index + 1) % numeroGiorni;
    }

    // Aggiungo eventi studio per ogni giorno (se non già presente)
    for (let i = 0; i < numeroGiorni; i++) {
      const giornoStr = giorniStudio[i];

      if (!hasStudioEventForVerifica(giornoStr, verificaId)) {
        calendar.addEvent({
          title: `Studio ${materia} (${distribuzione[i]} pag.)`,
          start: giornoStr,
          allDay: true,
          backgroundColor: "#007bff",
          borderColor: "#004085",
          extendedProps: {
            tipo: "studio",
            verificaId: verificaId,
            materia: materia,
            pagine: distribuzione[i],
            difficolta: difficoltaNum
          }
        });
      }
    }
  }
});