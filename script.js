document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'it',
    firstDay: 1,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek, timeGridDay'
    },
    events: []
  });
  calendar.render();   
  //event listener for adding and removing events
  calendar.on('dateClick', function(info) {
    const date = info.dateStr;
    const eventTitle = prompt('Inserisci il titolo dell\'evento:');
    if (eventTitle) {
      calendar.addEvent({
        title: eventTitle,
        start: date,
        allDay: true
      });
    }
  });
  calendar.on('eventClick', function(info) {
    const event = info.event;
    if (confirm(`Vuoi eliminare l'evento "${event.title}"?`)) {
      event.remove();
    }
  });
});
