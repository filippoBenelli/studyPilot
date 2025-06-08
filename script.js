document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'it',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    events: [
      // {
      //   title: 'Studia matematica - 10 pagine',
      //   start: '2025-06-10'
      // },
      // {
      //   title: 'Ripasso informatica',
      //   start: '2025-06-11'
      // }
    ]
  });
  calendar.render();
});
