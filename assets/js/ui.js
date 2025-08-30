// assets/js/ui.js

window.Football11UI = {
  showLoading: function(container, show = true) {
    container.find('.response-result').toggleClass('hidden', !show);
    container.find('.spinner').toggleClass('loading', show);
    $('.fixed-loading').toggle(show);
    $('.body-overlay').toggle(show);
  },

  showError: function(message) {
    console.error('Error:', message);
    if (typeof $ !== 'undefined') {
      $('.football11-app').each(function() {
        const container = $(this);
        container.find('.no-results .text').text(message);
        container.find('.no-results').removeClass('hidden');
      });
    }
  },

  renderMatchesList: function(container, fixtures) {
    this.displayMatchesByLeague(container, fixtures);
  },

  displayMatchesByLeague: function(container, fixtures) {
    const grouped = window.Football11App.groupBy(fixtures, f => f.league.id);
    const sortedLeagues = Object.entries(grouped).sort(([, a], [, b]) => {
      // ... sorting logic from app.js
    });

    sortedLeagues.forEach(([leagueId, leagueFixtures]) => {
      // ... rendering logic from app.js
    });

    this.bindShowMoreEvents();
  },

  renderMatchRowEnhanced: function(fixture) {
    // ... rendering logic from app.js
  },

  showPaginationProgress: function(currentPage, maxPages) {
    const progressHtml = `...`;
    $('body').append(progressHtml);
  },

  updatePaginationProgress: function(currentPage, maxPages) {
    // ...
  },

  hidePaginationProgress: function() {
    $('.pagination-progress').fadeOut(300, function() {
      $(this).remove();
    });
  },

  // ... and so on for all UI related functions from app.js
};
