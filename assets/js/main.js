(function($) {
    'use strict';

    if (!window.Football11App) {
        window.Football11App = {};
    }

    $.extend(window.Football11App, {
        config: F11COMPLETE || { /* defaults */ },
        cache: {},
        state: {
            currentDate: '2025-08-26',
            filters: { country: '', live: false, favorite: false, mainFilter: 'all' },
            favorites: { leagues: [], teams: [] }
        },

        init: function() {
            if (this.api && typeof this.api.init === 'function') this.api.init(this);
            if (this.ui && typeof this.ui.init === 'function') this.ui.init(this);

            // Immediately check for API key
            if (!this.config.api.key) {
                this.ui.showError('کلید API تنظیم نشده است. لطفاً از بخش تنظیمات افزونه، کلید خود را وارد کنید.');
                this.ui.showLoading($('.football11-app').first(), false); // Hide any loading indicators
                return; // Stop execution
            }

            this.initEvents();
            this.initFavorites();
            this.initPersianCalendar();
            this.loadInitialData();
        },

        loadInitialData: function() {
            const container = $('.football11-app').first();
            if(container.length) {
                const cfg = JSON.parse(container.attr('data-cfg') || '{}');
                this.loadMatches(container, cfg.date || this.state.currentDate);
                this.loadTopLeagues(container);
                this.loadCountries(container);
            }
        },

        getDateString: function(offset = 0) {
            const date = new Date();
            date.setDate(date.getDate() + offset);
            return date.toISOString().split('T')[0];
        },

        initFavorites: function() { /* ... */ },
        saveFavorites: function() { /* ... */ },
        toggleLeagueFavorite: function(leagueId) { /* ... */ },
        isLeagueFavorite: function(leagueId) { /* ... */ },
        sortLeaguesByPriority: function(leagues) { /* ... */ },
        initPersianCalendar: function() { /* ... */ },
        // Other non-UI functions...

        loadMatches: function(container, date = this.state.currentDate, filters = this.state.filters) {
            this.state.currentDate = date;
            this.ui.showLoading(container, true);

            const params = { date: this.state.currentDate, timezone: this.config.api.timezone };
            if (filters.country) params.country = filters.country;

            let apiCall;
            if (filters.live) {
                apiCall = this.api.fetchAPI('fixtures', { live: 'all' }, true);
            } else {
                apiCall = this.api.fetchFixturesWithPagination(params, 1);
            }

            apiCall.then(fixtures => {
                if (!fixtures || fixtures.length === 0) {
                    this.ui.showError('هیچ مسابقه‌ای یافت نشد.');
                    return;
                }
                // Filtering logic can be added here based on `filters.mainFilter`
                this.ui.displayMatchesByLeague(container, fixtures);
            })
            .catch(error => {
                console.error('Error loading matches:', error);
                this.ui.showError(`خطا در بارگذاری مسابقات: ${error.message}`);
            })
            .finally(() => {
                this.ui.showLoading(container, false);
            });
        },

        loadTopLeagues: function(container) {
            this.api.fetchAPI('leagues')
                .then(leagues => {
                    if (leagues && leagues.length > 0) {
                        const topLeagues = this.sortLeaguesByPriority(leagues.filter(l => l.league.type === 'League')).slice(0, 12);
                        // Assuming a function exists in ui.js to display this
                        // this.ui.displayTopLeagues(container, topLeagues);
                    }
                })
                .catch(error => {
                    console.error('Error loading top leagues:', error);
                    // Optionally show a more specific error in the UI
                    // this.ui.showErrorInContainer(container.find('.top-leagues'), `خطا: ${error.message}`);
                });
        },

        loadCountries: function(container) {
            this.api.fetchAPI('countries')
                .then(countries => {
                    // this.ui.displayCountries(container, countries);
                })
                .catch(error => {
                    console.error('Error loading countries:', error);
                });
        },

        loadMatchDetails: function(fixtureId) {
            this.api.fetchAPI('fixtures', { id: fixtureId })
                .then(fixtures => {
                    if(fixtures && fixtures.length > 0) {
                        this.ui.displayMatchInfo(fixtures[0]);
                    }
                })
                .catch(error => {
                    console.error(`Error loading details for fixture ${fixtureId}:`, error);
                    this.ui.showError(`خطا در بارگذاری جزئیات: ${error.message}`);
                });
        },

        initEvents: function() {
            const app = this;
            const container = $('.football11-app').first();

            container.on('click', '.top-tab-list .tab', function(e) {
                e.preventDefault();
                // ... logic to get date ...
                app.loadMatches(container, app.state.currentDate, app.state.filters);
            });

            container.on('click', '.match-row', function(e) {
                e.preventDefault();
                const fixtureId = $(this).data('fixture-id');
                if (fixtureId) app.loadMatchDetails(fixtureId);
            });

            container.on('click', '.favorite-btn', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const leagueId = $(this).data('league-id');
                if(leagueId) app.toggleLeagueFavorite(leagueId);
            });
        },

        // ... Other utility and placeholder functions from previous version
        groupBy: function(array, keyFn) { /* ... */ return array.reduce((r,i) => { const k = typeof keyFn === 'function' ? keyFn(i) : i[keyFn]; (r[k] = r[k] || []).push(i); return r; }, {}); },
        getTeamLogoUrl: function(logo, name) { return logo || `https://media.api-sports.io/football/teams/default.png`; },
        getMatchStatus: function(s) { const map = {'NS':'شروع نشده'}; return map[s] || s; }
    });

    $(document).ready(function() {
        // Defer initialization slightly to ensure all scripts are loaded
        setTimeout(function() {
            if (window.Football11App && typeof window.Football11App.init === 'function') {
                window.Football11App.init();
            } else {
                console.error("Bet Lahze App failed to initialize.");
                // Display a fallback error if the app object isn't even there
                $('.football11-app').html('<div class="error-container">خطای اساسی در بارگذاری برنامه. لطفاً صفحه را رفرش کنید.</div>');
            }
        }, 100);
    });

})(jQuery);
