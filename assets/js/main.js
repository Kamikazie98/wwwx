// assets/js/main.js

(function($) {
  'use strict';

  window.Football11App = {
    config: F11COMPLETE || {},
    state: {
      currentDate: '2025-08-26',
      filters: {
        country: '',
        live: false,
        favorite: false,
        mainFilter: 'all'
      },
      favorites: {
        leagues: [],
        teams: []
      }
    },

    init: function() {
      this.initEvents();
      // ... other init functions
    },

    initEvents: function() {
      const app = this;
      const container = $('.football11-app').first();

      // Top tabs
      container.find('.top-tab-list .tab').on('click', function(e) {
        e.preventDefault();
        container.find('.top-tab-list .tab').removeClass('active');
        $(this).addClass('active');
        let offset = 0;
        if ($(this).data('date') === 'yesterday') offset = -1;
        else if ($(this).data('date') === 'tomorrow') offset = 1;
        app.state.currentDate = offset ? app.getDateString(offset) : app.config.date;
        app.loadMatches(container, app.state.currentDate, app.state.filters);
      });

      // Filters
      container.find('.filter-item.region').on('change', function() {
        app.state.filters.country = $(this).val();
        app.loadMatches(container, app.state.currentDate, app.state.filters);
      });

      // ... other event listeners
    },

    loadMatches: function(container, date, filters) {
      if (filters.live) {
        this.loadLiveMatches(container);
      } else {
        this.loadMatchesWithFilter(container, filters.mainFilter);
      }
    },

    loadMatchesWithFilter: function(container, filterType) {
      window.Football11UI.showLoading(container, true);
      container.find('#match_list').empty();
      // ...
      window.Football11Api.fetchFixturesWithPagination({ date: this.state.currentDate, timezone: this.config.api.timezone })
        .then(fixtures => {
          // ... filtering logic
          window.Football11UI.displayMatchesByLeague(container, filteredFixtures);
        })
        .finally(() => {
          window.Football11UI.showLoading(container, false);
        });
    },

    // ... other main logic functions

    groupBy: function(array, keyFn) {
      return array.reduce((result, item) => {
        const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
        (result[key] = result[key] || []).push(item);
        return result;
      }, {});
    },

    getTeamLogoUrl: function(teamLogo, teamName) {
      if (teamLogo && teamLogo.trim() !== '') {
        return teamLogo;
      }
      return `https://media.api-sports.io/football/teams/default.png`;
    },
  };

  $(document).ready(() => window.Football11App.init());

})(jQuery);
