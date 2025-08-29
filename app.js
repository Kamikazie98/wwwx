// assets/js/app.js

// Football11 Complete App - Full Replica of footba11.co with API-Football v3

// Version: 3.0.0



(function($) {

    'use strict';

    var $c = $('.football11-app .livescore-container');

    if ($c.length) {

      $c.prepend($c.find('.livescore-right-box')); // بیار اول (سمت چپ)

      $c.append($c.find('.livescore-left-box'));   // ببر آخر (سمت راست)

    }

    window.Football11App = {

      config: F11COMPLETE || {

        api: {

          key: '',

          host: 'api-football-v1.p.rapidapi.com',

          base: 'https://api-football-v1.p.rapidapi.com/v3',

          timezone: 'Asia/Tehran'

        },

        cache: {

          live_ttl: 0,

          other_ttl: 0

        },
        pagination: {
          maxPages: 10, // Increased from 3 to support more pages
          delayBetweenPages: 500,
          maxResultsPerPage: 100,
          enableInfiniteScroll: true, // New: Enable infinite scroll
          loadMoreThreshold: 100, // New: Pixels from bottom to trigger load more
          autoLoadMore: true // New: Auto-load more on scroll
        }

      },

  

      cache: {},

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

  // --- NEW: read & sync ?page= ---
getInitialPageFromURL: function() {
  const p = parseInt(new URLSearchParams(window.location.search).get('page'), 10);
  return (Number.isNaN(p) || p < 1) ? 1 : p;
},

syncURLPageParam: function(page) {
  const url = new URL(window.location.href);
  if (page <= 1) url.searchParams.delete('page');
  else url.searchParams.set('page', page);
  window.history.replaceState({}, '', url);
},

// وضعیت فعلی صفحه برای ادامه‌ی Load More / اسکرول
statePagination: { currentPage: 1 },


      getDateString: function(offset = 0) {

        const date = new Date();

        date.setDate(date.getDate() + offset);

        return date.toISOString().split('T')[0];

      },

      // Favorites Management Functions
      initFavorites: function() {
        // Load favorites from localStorage
        const savedFavorites = localStorage.getItem('football11_favorites');
        if (savedFavorites) {
          try {
            this.state.favorites = JSON.parse(savedFavorites);
          } catch (e) {
            console.error('Error parsing favorites:', e);
            this.state.favorites = { leagues: [], teams: [] };
          }
        }
        console.log('Loaded favorites:', this.state.favorites);
      },

      saveFavorites: function() {
        localStorage.setItem('football11_favorites', JSON.stringify(this.state.favorites));
        console.log('Saved favorites:', this.state.favorites);
      },

      toggleLeagueFavorite: function(leagueId) {
        const index = this.state.favorites.leagues.indexOf(leagueId);
        if (index > -1) {
          // Remove from favorites
          this.state.favorites.leagues.splice(index, 1);
          console.log(`Removed league ${leagueId} from favorites`);
        } else {
          // Add to favorites
          this.state.favorites.leagues.push(leagueId);
          console.log(`Added league ${leagueId} to favorites`);
        }
        this.saveFavorites();
        this.updateLeagueFavoriteUI(leagueId);
      },

      isLeagueFavorite: function(leagueId) {
        return this.state.favorites.leagues.includes(leagueId);
      },

      updateLeagueFavoriteUI: function(leagueId) {
        const favoriteBtn = $(`.favorite-btn[data-league-id="${leagueId}"]`);
        if (favoriteBtn.length) {
          if (this.isLeagueFavorite(leagueId)) {
            favoriteBtn.addClass('active').html('<i class="fa fa-heart"></i>');
          } else {
            favoriteBtn.removeClass('active').html('<i class="fa fa-heart-o"></i>');
          }
        }
      },

      sortLeaguesByPriority: function(leagues) {
        // Sort leagues: Iran first, then favorites, then others
        return leagues.sort((a, b) => {
          const aIsIran = a.country.name === 'Iran';
          const bIsIran = b.country.name === 'Iran';
          const aIsFavorite = this.isLeagueFavorite(a.league.id);
          const bIsFavorite = this.isLeagueFavorite(b.league.id);
          
          // Iran leagues first
          if (aIsIran && !bIsIran) return -1;
          if (!aIsIran && bIsIran) return 1;
          
          // Then favorites
          if (aIsFavorite && !bIsFavorite) return -1;
          if (!aIsFavorite && bIsFavorite) return 1;
          
          // Then by country name
          return a.country.name.localeCompare(b.country.name);
        });
      },



      // Persian Calendar Functions

      initPersianCalendar: function() {

        this.currentPersianDate = this.getCurrentPersianDate();

        this.renderCalendar();

        this.bindCalendarEvents();

      },



      getCurrentPersianDate: function() {

        // Simple Persian date calculation (approximate)

        const now = new Date();

        const persianYear = now.getFullYear() - 621;

        const persianMonth = now.getMonth() + 1;

        const persianDay = now.getDate();

        

        return {

          year: persianYear,

          month: persianMonth,

          day: persianDay

        };

      },



      renderCalendar: function() {

        const monthNames = [

          'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',

          'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'

        ];

        

        $('.current-month').text(`${monthNames[this.currentPersianDate.month - 1]} ${this.currentPersianDate.year}`);

        

        const daysInMonth = this.getDaysInPersianMonth(this.currentPersianDate.year, this.currentPersianDate.month);

        const firstDayOfWeek = this.getFirstDayOfPersianMonth(this.currentPersianDate.year, this.currentPersianDate.month);

        

        let html = '';

        

        // Add empty cells for days before month starts

        for (let i = 0; i < firstDayOfWeek; i++) {

          html += '<span class="calendar-day empty"></span>';

        }

        

        // Add days of month

        for (let day = 1; day <= daysInMonth; day++) {

          const isToday = day === this.currentPersianDate.day;

          const isSelected = this.isSelectedDate(day);

          const dayClass = `calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`;

          html += `<span class="${dayClass}" data-day="${day}">${day}</span>`;

        }

        

        $('#calendar-days').html(html);

      },



      getDaysInPersianMonth: function(year, month) {

        // Simple calculation for Persian months

        if (month <= 6) return 31;

        if (month <= 11) return 30;

        return 29; // Esfand

      },



      getFirstDayOfPersianMonth: function(year, month) {

        // Simple calculation (approximate)

        const baseDate = new Date(622, 2, 21); // Persian calendar start

        const targetDate = new Date(year + 621, month - 1, 1);

        const diffTime = targetDate - baseDate;

        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return (diffDays + 3) % 7; // +3 for Persian calendar offset

      },



      // Convert Persian date to Gregorian date

      persianToGregorian: function(persianYear, persianMonth, persianDay) {

        // Persian calendar starts on March 21, 622 AD

        const persianEpoch = 1948081; // Julian day number for March 21, 622 AD

        

        // Calculate Julian day number for Persian date

        let jdn = persianEpoch + 

                  (persianYear - 1) * 365 + 

                  Math.floor((persianYear - 1) / 4) +

                  (persianMonth - 1) * 30 +

                  Math.floor((persianMonth - 1) / 6) * 5 +

                  persianDay;

        

        // Convert Julian day number to Gregorian date

        const a = jdn + 32044;

        const b = Math.floor((4 * a + 3) / 146097);

        const c = a - Math.floor((146097 * b) / 4);

        const d = Math.floor((4 * c + 3) / 1461);

        const e = c - Math.floor((1461 * d) / 4);

        const m = Math.floor((5 * e + 2) / 153);

        

        const gregorianDay = e - Math.floor((153 * m + 2) / 5) + 1;

        const gregorianMonth = m + 3 - 12 * Math.floor(m / 10);

        const gregorianYear = b * 100 + d - 4800 + Math.floor(m / 10);

        

        return new Date(gregorianYear, gregorianMonth - 1, gregorianDay);

      },



      // Check if a Persian date is currently selected

      isSelectedDate: function(day) {

        if (!this.state.currentDate) return false;

        

        const selectedDate = new Date(this.state.currentDate);

        const currentPersianDate = this.persianToGregorian(

          this.currentPersianDate.year,

          this.currentPersianDate.month,

          day

        );

        

        return selectedDate.toDateString() === currentPersianDate.toDateString();

      },



      // Convert Gregorian date to Persian date string

      getPersianDateString: function(gregorianDate) {

        if (!gregorianDate) return '';

        

        const date = new Date(gregorianDate);

        const monthNames = [

          'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',

          'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'

        ];

        

        // Simple conversion (approximate)

        const persianYear = date.getFullYear() - 621;

        const persianMonth = date.getMonth() + 1;

        const persianDay = date.getDate();

        

        return `${persianDay} ${monthNames[persianMonth - 1]} ${persianYear}`;

      },



      bindCalendarEvents: function() {

        $('.prev-month').on('click', () => {

          this.currentPersianDate.month--;

          if (this.currentPersianDate.month < 1) {

            this.currentPersianDate.month = 12;

            this.currentPersianDate.year--;

          }

          this.renderCalendar();

        });

        

        $('.next-month').on('click', () => {

          this.currentPersianDate.month++;

          if (this.currentPersianDate.month > 12) {

            this.currentPersianDate.month = 1;

            this.currentPersianDate.year++;

          }

          this.renderCalendar();

        });

        

        $('.today-btn').on('click', () => {

          this.currentPersianDate = this.getCurrentPersianDate();

          this.renderCalendar();

        });

        

              // Calendar day click

      $(document).on('click', '.calendar-day:not(.empty)', (e) => {

        const day = $(e.target).data('day');

        

        // Convert Persian date to Gregorian date

        const gregorianDate = this.persianToGregorian(

          this.currentPersianDate.year,

          this.currentPersianDate.month,

          day

        );

        

        // Format date for API (YYYY-MM-DD)

        const formattedDate = gregorianDate.toISOString().split('T')[0];

        

        // Update current date state

        this.state.currentDate = formattedDate;

        

        // Load matches for selected date

        const container = $('.football11-app').first();

        this.loadMatches(container, formattedDate, this.state.filters);

        

        // Update active tab to show selected date

        $('.top-tab-list .tab').removeClass('active');

        $('.top-tab-list .tab[data-date="today"]').addClass('active');

        

        // Re-render calendar to show selected date

        this.renderCalendar();

        

        console.log(`Selected Persian date: ${this.currentPersianDate.year}/${this.currentPersianDate.month}/${day}`);

        console.log(`Converted to Gregorian: ${formattedDate}`);

      });

      },

  

        fetchAPI: function(endpoint, params = {}, isLive = false) {

        const urlParams = new URLSearchParams(params).toString();

        const url = `${this.config.api.base}/${endpoint}?${urlParams}`;

        console.log('Fetching API:', url, 'with params:', params);
        console.log('URL params string:', urlParams);
        console.log('Full URL:', url);

        

        return fetch(url, {

          method: 'GET',

          headers: {

            'x-rapidapi-key': this.config.api.key,

            'x-rapidapi-host': this.config.api.host

          }

        })

        .then(response => {

          console.log('API Response status:', response.status);

          return response.ok ? response.json() : Promise.reject(`Status: ${response.status}`);

        })

        .then(data => {

          console.log('API Response data:', data);

          if (data.errors && Object.keys(data.errors).length) {

            throw new Error(JSON.stringify(data.errors));

          }

          return data.response;

        })

        .catch(error => {

          console.error('API Error:', error);

          return [];

        });

      },


      // Fetch fixtures with pagination support - Updated for infinite scroll
      fetchFixturesWithPagination: function(params, maxPages = null, isLoadMore = false) {
        const config = this.config.pagination;
        maxPages = maxPages || config.maxPages;
        
        if (isLoadMore) {
          console.log('🔄 Loading more fixtures...');
        } else {
          console.log('🔄 Fetching fixtures with pagination, max pages:', maxPages);
        }
        
        // If maxPages is 1, just fetch a single page directly
        if (maxPages === 1) {
          const pageParams = { ...params, page: 1 };
          console.log(`🔄 Single page fetch with params:`, pageParams);
          
          return this.fetchAPI('fixtures', pageParams, false)
            .then(fixtures => {
              console.log(`🔄 Single page returned ${fixtures ? fixtures.length : 0} fixtures`);
              return fixtures || [];
            })
            .catch(error => {
              console.error(`🔄 Error fetching single page:`, error);
              return [];
            });
        }
        
        // Multi-page logic for when maxPages > 1
        const allFixtures = [];
        let currentPage = 1;
        const maxResults = maxPages * config.maxResultsPerPage;
        
        // Show pagination progress only for initial load
        if (!isLoadMore) {
          this.showPaginationProgress(currentPage, maxPages);
        }
        
        const fetchPage = (page) => {
          const pageParams = { ...params, page };
          console.log(`🔄 Fetching page ${page} with params:`, pageParams);
          console.log(`🔄 Original params:`, params);
          console.log(`🔄 Page params after merge:`, pageParams);
          
          // Update progress only for initial load
          if (!isLoadMore) {
            this.updatePaginationProgress(page, maxPages);
          }
          
          // Add a small delay between requests to prevent overwhelming the API
          const delay = page > 1 ? config.delayBetweenPages : 0;
          
          return new Promise(resolve => {
            setTimeout(() => {
              this.fetchAPI('fixtures', pageParams, false)
                .then(fixtures => {
                  console.log(`🔄 Page ${page} returned ${fixtures ? fixtures.length : 0} fixtures`);
                  
                  if (fixtures && fixtures.length > 0) {
                    allFixtures.push(...fixtures);
                    
                    // If we got a full page and haven't reached max pages, continue
                    if (fixtures.length === config.maxResultsPerPage && currentPage < maxPages && allFixtures.length < maxResults) {
                      currentPage++;
                      resolve(fetchPage(currentPage));
                    } else {
                      if (!isLoadMore) {
                        this.hidePaginationProgress();
                      }
                      resolve(allFixtures);
                    }
                  } else {
                    if (!isLoadMore) {
                      this.hidePaginationProgress();
                    }
                    resolve(allFixtures);
                  }
                })
                .catch(error => {
                  console.error(`🔄 Error fetching page ${page}:`, error);
                  if (!isLoadMore) {
                    this.hidePaginationProgress();
                  }
                  resolve(allFixtures); // Return what we have so far
                });
            }, delay);
          });
        };
        
        return fetchPage(currentPage);
      },

      // Show pagination progress indicator
      showPaginationProgress: function(currentPage, maxPages) {
        const progressHtml = `
          <div class="pagination-progress">
            <div class="progress-text">🔄 در حال دریافت نتایج...</div>
            <div class="progress-info">صفحه ${currentPage} از ${maxPages}</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${(currentPage / maxPages) * 100}%"></div>
            </div>
          </div>
        `;
        
        // Remove existing progress if any
        $('.pagination-progress').remove();
        
        // Add progress indicator
        $('body').append(progressHtml);
      },

      // Update pagination progress
      updatePaginationProgress: function(currentPage, maxPages) {
        const progress = $('.pagination-progress');
        if (progress.length) {
          progress.find('.progress-fill').css('width', `${(currentPage / maxPages) * 100}%`);
          progress.find('.progress-info').text(`صفحه ${currentPage} از ${maxPages}`);
        }
      },

      // Hide pagination progress
      hidePaginationProgress: function() {
        $('.pagination-progress').fadeOut(300, function() {
          $(this).remove();
        });
      },

      // Infinite scroll pagination - Load more fixtures
      loadMoreFixtures: function(container, params, currentPage = 1) {
        const config = this.config.pagination;
        const nextPage = currentPage + 1;
        
        console.log(`🔄 Loading more fixtures - Page ${nextPage}`);
        
        // Set loading state
        this.setLoadingMoreState(true);
        
        // Show loading indicator for load more
        this.showLoadMoreProgress(container, nextPage);
        
        // Add page parameter to API call
        const pageParams = { ...params, page: nextPage };
        console.log(`🔄 Load more - Original params:`, params);
        console.log(`🔄 Load more - Page params with page ${nextPage}:`, pageParams);
        
        return this.fetchAPI('fixtures', pageParams, false)
          .then(fixtures => {
            console.log(`🔄 Load more returned ${fixtures ? fixtures.length : 0} fixtures`);
            
            if (fixtures && fixtures.length > 0) {
              // Hide load more progress
              this.hideLoadMoreProgress(container);
              
              // Append new fixtures to existing list
              this.appendMatchesToList(container, fixtures);
              
              // Check if we should show load more button again
              if (fixtures.length === config.maxResultsPerPage) {
                this.showLoadMoreButton(container, params, nextPage);
              } else {
                // No more pages, hide load more button
              }
              
              // Reset loading state
              this.setLoadingMoreState(false);
              return fixtures;
            } else {
              // No more fixtures
              this.hideLoadMoreProgress(container);
              this.hideLoadMoreButton(container);
              // Reset loading state
              this.setLoadingMoreState(false);
              return [];
            }
          })
          .catch(error => {
            console.error('🔄 Error loading more fixtures:', error);
            this.hideLoadMoreProgress(container);
            this.showLoadMoreError(container);
            // Reset loading state
            this.setLoadingMoreState(false);
            return [];
          });
      },

      // Show load more progress indicator
      showLoadMoreProgress: function(container, page) {
        const progressHtml = `
          <div class="load-more-progress">
            <div class="progress-spinner">🔄</div>
            <div class="progress-text">در حال بارگذاری صفحه ${page}...</div>
          </div>
        `;
        
        // Remove existing progress if any
        container.find('.load-more-progress').remove();
        
        // Add progress indicator after match list
        container.find('#match_list').after(progressHtml);
      },

      // Hide load more progress
      hideLoadMoreProgress: function(container) {
        container.find('.load-more-progress').fadeOut(300, function() {
          $(this).remove();
        });
      },

      // Show load more button
      showLoadMoreButton: function(container, params, currentPage) {
        const buttonHtml = `
          <div class="load-more-container">
            <button class="load-more-btn" data-params='${JSON.stringify(params)}' data-page="${currentPage}">
              <span class="btn-text">نمایش مسابقات بیشتر</span>
              <span class="btn-icon">⬇️</span>
            </button>
          </div>
        `;
        
        // Remove existing button if any
        container.find('.load-more-container').remove();
        
        // Add button after match list
        container.find('#match_list').after(buttonHtml);
        
        // Bind click event
        container.find('.load-more-btn').off('click').on('click', (e) => {
          e.preventDefault();
          const btn = $(e.currentTarget);
          const btnParams = JSON.parse(btn.data('params'));
          const btnPage = parseInt(btn.data('page'));
          
          // Disable button during loading
          btn.prop('disabled', true).find('.btn-text').text('در حال بارگذاری...');
          
          // داخل click-handler در showLoadMoreButton
this.loadMoreFixtures(container, btnParams, btnPage)
  .then((fixtures) => {
    // اگر هنوز دکمه هست یعنی ادامه داریم
    const next = btnPage + 1;
    this.statePagination.currentPage = next;
    this.syncURLPageParam(next);
    if (container.find('.load-more-container').length) {
      btn.prop('disabled', false).find('.btn-text').text('نمایش مسابقات بیشتر');
      // update data-page روی دکمه برای ادامه‌ی درست
      btn.data('page', next);
    }
  });

        });
      },

      // Hide load more button
      hideLoadMoreButton: function(container) {
        container.find('.load-more-container').fadeOut(300, function() {
          $(this).remove();
        });
      },

      // Show load more error
      showLoadMoreError: function(container) {
        const errorHtml = `
          <div class="load-more-error">
            <div class="error-text">خطا در بارگذاری مسابقات بیشتر</div>
            <button class="retry-btn">تلاش مجدد</button>
          </div>
        `;
        
        // Remove existing error if any
        container.find('.load-more-error').remove();
        
        // Add error message after match list
        container.find('#match_list').after(errorHtml);
        
        // Bind retry event
        container.find('.retry-btn').off('click').on('click', (e) => {
          e.preventDefault();
          container.find('.load-more-error').remove();
          // Re-show load more button
          const params = container.find('.load-more-btn').data('params');
          const page = container.find('.load-more-btn').data('page');
          if (params && page) {
            this.showLoadMoreButton(container, params, page);
          }
        });
      },

      // Append new matches to existing list
      appendMatchesToList: function(container, fixtures) {
        if (!fixtures || !fixtures.length) return;
        
        // Group fixtures by league
        const groupedFixtures = this.groupBy(fixtures, 'league.id');
        
        // For each league, append new matches
        Object.keys(groupedFixtures).forEach(leagueId => {
          const leagueFixtures = groupedFixtures[leagueId];
          const existingLeague = container.find(`[data-league-id="${leagueId}"]`);
          
          if (existingLeague.length) {
            // Append to existing league section
            const leagueContainer = existingLeague.find('.league-matches');
            leagueFixtures.forEach(fixture => {
              const matchRow = this.renderMatchRow(fixture);
              leagueContainer.append(matchRow);
            });
          } else {
            // Create new league section and append
            this.displayMatchesByLeague(container, leagueFixtures, true);
          }
        });
      },

      // Initialize infinite scroll functionality
      initInfiniteScroll: function(container) {
        if (!this.config.pagination.enableInfiniteScroll) return;
        
        console.log('🔄 Initializing infinite scroll...');
        
        // Remove existing scroll handlers
        container.off('scroll.infinite');
        
        // Add scroll event handler
        container.on('scroll.infinite', (e) => {
          if (!this.config.pagination.autoLoadMore) return;
          
          const scrollTop = container.scrollTop();
          const scrollHeight = container[0].scrollHeight;
          const clientHeight = container[0].clientHeight;
          const threshold = this.config.pagination.loadMoreThreshold;
          
          // Check if user is near bottom
          if (scrollTop + clientHeight >= scrollHeight - threshold) {
            this.handleInfiniteScroll(container);
          }
        });
      },

      // Handle infinite scroll trigger
      handleInfiniteScroll: function(container) {
        // Prevent multiple simultaneous loads
        if (this.isLoadingMore) return;
        
        const loadMoreBtn = container.find('.load-more-btn');
        if (!loadMoreBtn.length) return;
        
        console.log('🔄 Infinite scroll triggered');
        
        // Simulate click on load more button
        loadMoreBtn.trigger('click');
      },

      // Set loading more state
      setLoadingMoreState: function(loading) {
        this.isLoadingMore = loading;
      },
  

      showLoading: function(container, show = true) {

        container.find('.response-result').toggleClass('hidden', !show);

        container.find('.spinner').toggleClass('loading', show);

        $('.fixed-loading').toggle(show);

        $('.body-overlay').toggle(show);

      },

  

      showError: function(message) {

        console.error('Error:', message);

        // Show error in a more generic way

        if (typeof $ !== 'undefined') {

          $('.football11-app').each(function() {

            const container = $(this);

            container.find('.no-results .text').text(message);

            container.find('.no-results').removeClass('hidden');

          });

        }

      },

  

      loadMatches: function(container, date = this.state.currentDate, filters = this.state.filters) {

        // Update current date

        this.state.currentDate = date;

        

        // If live filter is active, load live matches

        if (filters.live) {

          this.loadLiveMatches(container);

        } else {

          // Use main filter system

          const mainFilter = filters.mainFilter || 'all';

          this.loadMatchesWithFilter(container, mainFilter);

        }

      },



      // Load matches with main filter (Sofascore style)

      loadMatchesWithFilter: function(container, filterType) {

        console.log('🔧 Loading matches with filter:', filterType);

        this.showLoading(container, true);

        container.find('#match_list').empty();

        container.find('.no-results').addClass('hidden');

        

        const params = {

          date: this.state.currentDate,

          timezone: this.config.api.timezone

        };

        

        if (this.state.filters.country) params.country = this.state.filters.country;

        

                console.log('🔧 API params:', params);

        // Add page parameter for initial load
        const initialPage = this.getInitialPageFromURL();
        this.statePagination.currentPage = initialPage;
const initialParams = { ...params, page: initialPage };
        this.fetchFixturesWithPagination(initialParams, 1) // Fetch only 1 page initially, then use load more
          .then(fixtures => {

            console.log('🔧 API response with pagination:', fixtures);
            console.log('🔧 Total fixtures fetched:', fixtures.length);
             if (fixtures.length === this.config.pagination.maxResultsPerPage) {
      this.showLoadMoreButton(container, params, initialPage);
      // اینفینیت‌اسکرول روی ظرف اسکرول (#match_list)
      this.initInfiniteScroll(container.find('#match_list'));
    }
            if (!fixtures.length) {

              container.find('.no-results .text').text('هیچ مسابقه‌ای یافت نشد.');

              container.find('.no-results').removeClass('hidden');

              return;

            }
           


            // Filter matches based on main filter type

            let filteredFixtures = fixtures;

            switch(filterType) {

              case 'live':

                filteredFixtures = fixtures.filter(f => f.fixture.status.short === 'LIVE' || 

                                                      f.fixture.status.short === 'HT' || 

                                                      f.fixture.status.short === '2H');

                break;

              case 'finished':

                filteredFixtures = fixtures.filter(f => f.fixture.status.short === 'FT' || 

                                                      f.fixture.status.short === 'AET' || 

                                                      f.fixture.status.short === 'PEN');

                break;

              case 'upcoming':

                filteredFixtures = fixtures.filter(f => f.fixture.status.short === 'NS' || 

                                                      f.fixture.status.short === 'TBD');

                break;

              case 'all':

              default:

                // Show all matches

                break;

            }
            
            // Apply favorites filter if active
            if (this.state.filters.favorite) {
              filteredFixtures = filteredFixtures.filter(f => this.isLeagueFavorite(f.league.id));
              console.log('🔧 Applied favorites filter, remaining fixtures:', filteredFixtures.length);
            }

            console.log('🔧 Filtered fixtures:', filteredFixtures);



            if (!filteredFixtures.length) {

              let message = 'هیچ مسابقه‌ای یافت نشد.';

              switch(filterType) {

                case 'live': message = 'هیچ مسابقه زنده‌ای یافت نشد.'; break;

                case 'finished': message = 'هیچ مسابقه تموم شده‌ای یافت نشد.'; break;

                case 'upcoming': message = 'هیچ مسابقه شروع نشده‌ای یافت نشد.'; break;

              }

              container.find('.no-results .text').text(message);

              container.find('.no-results').removeClass('hidden');

              return;

            }



            // Update live count

            const liveCount = fixtures.filter(f => f.fixture.status.short === 'LIVE' || 

                                                  f.fixture.status.short === 'HT' || 

                                                  f.fixture.status.short === '2H').length;

            container.find('#live-count').text(liveCount);


            // Cache fixtures for show more functionality
            this.cacheLeagueFixtures(filteredFixtures);


            // Group and display filtered matches

            this.displayMatchesByLeague(container, filteredFixtures);
            
            // Show load more button if we got a full page of results
            // This indicates there might be more data available
            if (fixtures.length === this.config.pagination.maxResultsPerPage) {
              this.showLoadMoreButton(container, params, 1);
            }

          })

          .catch(error => {

            console.error('🔧 Filter error:', error);

            
            // Try to fallback to single page fetch if pagination failed
            console.log('🔄 Attempting fallback to single page fetch...');
            this.fetchAPI('fixtures', params, false)
              .then(fixtures => {
                if (fixtures && fixtures.length > 0) {
                  console.log('🔄 Fallback successful, got', fixtures.length, 'fixtures');
                  this.cacheLeagueFixtures(fixtures);
                  this.displayMatchesByLeague(container, fixtures);
                } else {
            container.find('.no-results .text').text('خطا در بارگذاری مسابقات. لطفاً دوباره تلاش کنید.');

            container.find('.no-results').removeClass('hidden');

                }
              })
              .catch(fallbackError => {
                console.error('🔄 Fallback also failed:', fallbackError);
                container.find('.no-results .text').text('خطا در بارگذاری مسابقات. لطفاً دوباره تلاش کنید.');
                container.find('.no-results').removeClass('hidden');
              });
          })

          .finally(() => {

            this.showLoading(container, false);

          });

      },


      // Cache league fixtures for show more functionality
      cacheLeagueFixtures: function(fixtures) {
        if (!this.cachedLeagueFixtures) this.cachedLeagueFixtures = {};
        
        // Group fixtures by league and cache them
        const grouped = this.groupBy(fixtures, f => f.league.id);
        Object.entries(grouped).forEach(([leagueId, leagueFixtures]) => {
          this.cachedLeagueFixtures[leagueId] = leagueFixtures;
        });
        
        console.log('✅ Cached fixtures for', Object.keys(grouped).length, 'leagues');
      },


            // Load matches by specific date

      loadMatchesByDate: function(container, date, filters) {

        this.showLoading(container, true);

        container.find('#match_list').empty();

        container.find('.no-results').addClass('hidden');

        

        const params = {

          date,

          timezone: this.config.api.timezone

        };

        

        if (filters.country) params.country = filters.country;

        // Add page parameter for initial load
        const initialParams = { ...params, page: 1 };
        console.log('📅 Initial params with page:', initialParams);
        this.fetchFixturesWithPagination(initialParams, 1) // Fetch only 1 page initially, then use load more
          .then(fixtures => {

            console.log('📅 Date-based fixtures response with pagination:', fixtures);
            console.log('📅 Total fixtures fetched for date:', fixtures.length);
            
            if (!fixtures.length) {

              // Show Persian date in message if available

              let message = 'هیچ مسابقه‌ای یافت نشد.';

              if (this.currentPersianDate) {

                const persianDateStr = this.getPersianDateString(date);

                message = `هیچ مسابقه‌ای برای ${persianDateStr} یافت نشد.`;

              }

              container.find('.no-results .text').text(message);

              container.find('.no-results').removeClass('hidden');

              return;

            }

  

                    // Cache fixtures for show more functionality
        this.cacheLeagueFixtures(fixtures);
        
        // Use the new display function
        this.displayMatchesByLeague(container, fixtures);
        
        // Show load more button if we got a full page of results
        // This indicates there might be more data available
        if (fixtures.length === this.config.pagination.maxResultsPerPage) {
          this.showLoadMoreButton(container, params, 1);
        }
      })
      .catch(error => {
        console.error('📅 Date-based fixtures error:', error);
        
        // Try to fallback to single page fetch if pagination failed
        console.log('🔄 Attempting fallback to single page fetch for date...');
        // Add page parameter for fallback
        const fallbackParams = { ...params, page: 1 };
        this.fetchAPI('fixtures', fallbackParams, false)
              .then(fixtures => {
                if (fixtures && fixtures.length > 0) {
                  console.log('🔄 Fallback successful, got', fixtures.length, 'fixtures');
                  this.cacheLeagueFixtures(fixtures);
                  this.displayMatchesByLeague(container, fixtures);
                } else {
                  // Show Persian date in message if available
                  let message = 'هیچ مسابقه‌ای یافت نشد.';
                  if (this.currentPersianDate) {
                    const persianDateStr = this.getPersianDateString(date);
                    message = `هیچ مسابقه‌ای برای ${persianDateStr} یافت نشد.`;
                  }
                  container.find('.no-results .text').text(message);
                  container.find('.no-results').removeClass('hidden');
                }
              })
              .catch(fallbackError => {
                console.error('🔄 Fallback also failed:', fallbackError);
                // Show Persian date in message if available
                let message = 'خطا در بارگذاری مسابقات. لطفاً دوباره تلاش کنید.';
                if (this.currentPersianDate) {
                  const persianDateStr = this.getPersianDateString(date);
                  message = `خطا در بارگذاری مسابقات برای ${persianDateStr}. لطفاً دوباره تلاش کنید.`;
                }
                container.find('.no-results .text').text(message);
                container.find('.no-results').removeClass('hidden');
            });

          })

          .finally(() => this.showLoading(container, false));

      },



      // Load live matches specifically

      loadLiveMatches: function(container) {

        this.showLoading(container, true);

        container.find('#match_list').empty();

        container.find('.no-results').addClass('hidden');

        

        const params = { live: 'all' };

        

        this.fetchAPI('fixtures', params, true)

          .then(fixtures => {

            if (!fixtures.length) {

              container.find('.no-results .text').text('هیچ مسابقه زنده‌ای در حال انجام نیست.');

              container.find('.no-results').removeClass('hidden');

              return;

            }

            

            this.renderMatchesList(container, fixtures);

          })

          .catch(error => {

            console.error('Error loading live matches:', error);

            container.find('.no-results .text').text('خطا در بارگذاری مسابقات زنده.');

            container.find('.no-results').removeClass('hidden');

          })

        .finally(() => this.showLoading(container, false));

      },



      // Render matches list (common function for both live and date-based matches)

      renderMatchesList: function(container, fixtures) {

        // Cache fixtures for show more functionality
        this.cacheLeagueFixtures(fixtures);
        
        // Use the new display function
        this.displayMatchesByLeague(container, fixtures);
      },

  

      groupBy: function(array, keyFn) {

        return array.reduce((result, item) => {

          const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];

          (result[key] = result[key] || []).push(item);

          return result;

        }, {});

      },

  

      renderMatchRow: function(fixture) {

        const { teams, goals, fixture: fix, league } = fixture;

        const status = fix.status.short;

        const statusText = this.getStatusText(status);

        const statusClass = this.getStatusClass(status);

        

        // Format time

        const matchTime = new Date(fix.date);

        const timeString = matchTime.toLocaleTimeString('fa-IR', { 

          hour: '2-digit', 

          minute: '2-digit',

          hour12: false 

        });

        

        // Format score

        const homeScore = goals.home !== null ? goals.home : '-';

        const awayScore = goals.away !== null ? goals.away : '-';

        

        return `

          <div class="match-row" data-fixture-id="${fix.id}">

            <div class="match-status ${statusClass}">

              <span class="status-text">${statusText}</span>

              ${status === 'LIVE' || status === 'HT' || status === '2H' ? 

                `<span class="match-time">${timeString}</span>` : 

                `<span class="match-time">${timeString}</span>`

              }

            </div>

            

            <div class="match-teams">

              <div class="team home-team">

                <span class="team-name">${teams.home.name}</span>

              </div>

              <div class="team away-team">

                <span class="team-name">${teams.away.name}</span>

              </div>

            </div>

            

            <div class="match-score">

              <span class="score">${homeScore} - ${awayScore}</span>

            </div>

            

            <div class="match-actions">

              <button class="favorite-btn" data-fixture-id="${fix.id}">

                <i class="fa fa-star-o"></i>

              </button>

            </div>

          </div>

        `;

      },



      // Get status text in Persian

      getStatusText: function(status) {

        const statusMap = {

          'NS': 'شروع نشده',

          'LIVE': 'زنده',

          'HT': 'نیمه اول',

          '2H': 'نیمه دوم',

          'FT': 'تمام شده',

          'AET': 'تموم شده (اضافه)',

          'PEN': 'تموم شده (پنالتی)',

          'TBD': 'تعیین نشده',

          'CANC': 'لغو شده',

          'POST': 'تعویق شده'

        };

        return statusMap[status] || status;

      },



      // Get status class for styling

      getStatusClass: function(status) {

        const classMap = {

          'NS': 'status-upcoming',

          'LIVE': 'status-live',

          'HT': 'status-live',

          '2H': 'status-live',

          'FT': 'status-finished',

          'AET': 'status-finished',

          'PEN': 'status-finished',

          'TBD': 'status-upcoming',

          'CANC': 'status-cancelled',

          'POST': 'status-postponed'

        };

        return classMap[status] || 'status-unknown';

      },



      loadBestTeam: function(container) {

        const params = {

          league: 39,

          season: 2025

        };

        this.fetchAPI('players/topscorers', params)

          .then(players => {

            if (!players.length) return;

            const positions = [

              { top: '90%', left: '50%' },

              { top: '70%', left: '20%' }, { top: '70%', left: '40%' }, { top: '70%', left: '60%' }, { top: '70%', left: '80%' },

              { top: '50%', left: '30%' }, { top: '50%', left: '50%' }, { top: '50%', left: '70%' },

              { top: '30%', left: '40%' }, { top: '30%', left: '60%' },

              { top: '10%', left: '50%' }

            ];

            const playersHtml = players.slice(0, 11).map((p, i) => {

              const player = p.player;

              const stats = p.statistics[0];

              const rating = stats.games.rating || '7.0';

              return `

                <a class="player" style="top: ${positions[i].top}; left: ${positions[i].left};">

                  <span class="jersey">

                    <img class="player-photo" src="${player.photo}" alt="${player.name}">

                    <span class="rating">${rating}</span>

                    <img class="team-logo" src="${stats.team.logo}" alt="${stats.team.name}">

                  </span>

                  <span class="name">${player.firstname} ${player.lastname}</span>

                </a>

              `;

            }).join('');

            container.find('.best-team .players').html(playersHtml);

            container.find('.formation .name').text('4-4-2');

            container.find('.formation .rating').text('8.5');

          })

          .catch(error => {

            console.error('Error loading best team:', error);

          });

      },

  

      loadNews: function(container) {

        const newsItems = [

          { title: 'پرسپولیس قهرمان لیگ شد', date: '۱۴۰۴/۰۶/۰۴', image: 'https://via.placeholder.com/60x45', link: '#' },

          { title: 'رئال مادرید در صدر لالیگا', date: '۱۴۰۴/۰۶/۰۳', image: 'https://via.placeholder.com/60x45', link: '#' },

          { title: 'مسی بهترین بازیکن سال', date: '۱۴۰۴/۰۶/۰۲', image: 'https://via.placeholder.com/60x45', link: '#' }

        ];

        const html = newsItems.map(item => `

          <li class="item">

            <div class="item-image"><img src="${item.image}" alt=""></div>

            <div class="item-text">

              <a class="item-title" href="${item.link}">${item.title}</a>

              <span class="item-date">${item.date}</span>

            </div>

          </li>

        `).join('');

        container.find('.news-list ul').html(html);

      },

  

      loadTournament: function(container, leagueId, season) {

        this.showLoading(container, true);

        container.find('.flt-table tbody').empty();

        container.find('.no-results').addClass('hidden');

  

        this.fetchAPI('standings', { league: leagueId, season })

          .then(standings => {

            if (!standings.length || !standings[0].league.standings) {

              container.find('.no-results .text').text('جدول رده‌بندی یافت نشد.');

              container.find('.no-results').removeClass('hidden');

              return;

            }

            const table = standings[0].league.standings[0];

            const html = table.map(team => `

              <tr>

                <td>${team.rank}</td>

                <td><img src="${team.team.logo}" alt="${team.team.name}" style="width: 24px; vertical-align: middle;"> ${team.team.name}</td>

                <td>${team.all.played}</td>

                <td>${team.all.win}</td>

                <td>${team.all.draw}</td>

                <td>${team.all.lose}</td>

                <td>${team.all.goals.for}:${team.all.goals.against}</td>

                <td>${team.goalsDiff}</td>

                <td>${team.points}</td>

                <td>${team.form.split('').map(f => `<span class="${f.toLowerCase()}">${f}</span>`).join(' ')}</td>

              </tr>

            `).join('');

            container.find('.flt-table tbody').html(html);

          })

          .finally(() => this.showLoading(container, false));

      },

  

            loadMatchDetails: function(fixtureId) {

        const app = this;

        

        // Match details are always visible, no need to show/hide
        // $('.match-details-sidebar').show();

        

        // Load basic match info

        this.loadMatchInfo(fixtureId);

        

        // Set current fixture ID

        this.currentFixtureId = fixtureId;

        

        // Show first tab by default

        $('.match-nav-tabs .tab-list li').removeClass('active');

        $('.match-nav-tabs .tab-list li:first').addClass('active');

        $('.tab-content').removeClass('active');

        $('#match-info').addClass('active');

        

        // Initialize horizontal scroll functionality

        this.initHorizontalScroll();

      },



      // Initialize horizontal scroll functionality for match details

      initHorizontalScroll: function() {

        const app = this;

        

        // Add scroll indicators to content sections

        this.addScrollIndicators();

        

        // Bind scroll events for better UX

        $('.match-details-content').on('scroll', function() {

          app.updateScrollIndicators($(this));

        });

        

        // Add touch/swipe support for mobile

        this.addTouchScrollSupport();

      },



      // Add scroll indicators to content sections

      addScrollIndicators: function() {

        // Add left scroll indicator

        if (!$('.scroll-indicator.left').length) {

          $('.match-details-content').append('<div class="scroll-indicator left">‹</div>');

        }

        

        // Add right scroll indicator

        if (!$('.scroll-indicator.right').length) {

          $('.match-details-content').append('<div class="scroll-indicator right">›</div>');

        }

        

        // Update indicators initially

        this.updateScrollIndicators($('.match-details-content'));

      },



      // Update scroll indicators based on scroll position

      updateScrollIndicators: function(container) {

        const scrollLeft = container.scrollLeft();

        const scrollWidth = container[0].scrollWidth;

        const clientWidth = container[0].clientWidth;

        

        // Show/hide left indicator

        if (scrollLeft > 0) {

          container.find('.scroll-indicator.left').show();

        } else {

          container.find('.scroll-indicator.left').hide();

        }

        

        // Show/hide right indicator

        if (scrollLeft < scrollWidth - clientWidth - 1) {

          container.find('.scroll-indicator.right').show();

        } else {

          container.find('.scroll-indicator.right').hide();

        }

      },



      // Add touch scroll support for mobile devices

      addTouchScrollSupport: function() {

        let startX = 0;

        let startY = 0;

        let scrollLeft = 0;

        let scrollTop = 0;

        let isScrolling = false;

        

        $('.match-details-content').on('touchstart', function(e) {

          const touch = e.originalEvent.touches[0];

          startX = touch.clientX;

          startY = touch.clientY;

          scrollLeft = this.scrollLeft;

          scrollTop = this.scrollTop;

          isScrolling = false;

        });

        

        $('.match-details-content').on('touchmove', function(e) {

          if (!startX || !startY) return;

          

          const touch = e.originalEvent.touches[0];

          const deltaX = startX - touch.clientX;

          const deltaY = startY - touch.clientY;

          

          // Determine if this is a horizontal scroll

          if (Math.abs(deltaX) > Math.abs(deltaY)) {

            e.preventDefault();

            this.scrollLeft = scrollLeft + deltaX;

            isScrolling = true;

          }

        });

        

        $('.match-details-content').on('touchend', function(e) {

          startX = 0;

          startY = 0;

          

          // Add momentum scrolling effect

          if (isScrolling) {

            this.style.scrollBehavior = 'smooth';

            setTimeout(() => {

              this.style.scrollBehavior = 'auto';

            }, 300);

          }

        });

      },



      updateMatchHeader: function(fixture) {

        const { teams, goals, fixture: fix, league } = fixture;

        

        // Update team logos and names with fallback

        if (teams.home.logo) {

          $('.match-details-sidebar .home-team .team-logo').attr('src', teams.home.logo).attr('alt', teams.home.name);

        } else {

          $('.match-details-sidebar .home-team .team-logo').attr('src', 'https://media.api-sports.io/football/teams/default.png').attr('alt', teams.home.name);

        }

        $('.match-details-sidebar .home-team .team-name').text(teams.home.name);

        

        if (teams.away.logo) {

          $('.match-details-sidebar .away-team .team-logo').attr('src', teams.away.logo).attr('alt', teams.away.name);

        } else {

          $('.match-details-sidebar .away-team .team-logo').attr('src', 'https://media.api-sports.io/football/teams/default.png').attr('alt', teams.away.name);

        }

        $('.match-details-sidebar .away-team .team-name').text(teams.away.name);

        

        // Update score - handle both goals and score objects

        let scoreText = '';

        if (goals.home !== null && goals.away !== null) {

          scoreText = `${goals.home} - ${goals.away}`;

        } else if (fix.score && fix.score.fulltime) {

          scoreText = `${fix.score.fulltime.home || 0} - ${fix.score.fulltime.away || 0}`;

        } else {

          scoreText = '0 - 0';

        }

        $('.match-details-sidebar .match-score .score').text(scoreText);

        

        // Update match status and time

        $('.match-details-sidebar .match-status').text(fix.status.long);

        $('.match-details-sidebar .match-time').text(fix.status.elapsed ? `${fix.status.elapsed}'` : '');

        

        // Update match info

        $('.match-details-sidebar .info-list .info-value').eq(0).text(league.name);

        $('.match-details-sidebar .info-list .info-value').eq(1).text(league.season);

        $('.match-details-sidebar .info-list .info-value').eq(2).text(league.round || 'مرحله عادی');

        $('.match-details-sidebar .info-list .info-value').eq(3).text(new Date(fix.date).toLocaleDateString('fa-IR'));

        $('.match-details-sidebar .info-list .info-value').eq(4).text(this.getMatchStatus(fix.status.short));

        

        // Update venue if available

        if (fix.venue && fix.venue.name) {

          $('.match-details-sidebar .venue').text(fix.venue.name);

        }

        

        // Add team IDs for future reference

        $('.match-details-sidebar').attr('data-home-team-id', teams.home.id);

        $('.match-details-sidebar').attr('data-away-team-id', teams.away.id);

      },



      loadOverviewTab: function(fixture) {

        const { teams, goals, fixture: fix, league } = fixture;

        

        const html = `

          <div class="overview-content">

            <div class="match-summary">

              <h4>خلاصه بازی</h4>

              <div class="summary-item">

                <span class="label">وضعیت:</span>

                <span class="value">${fix.status.long}</span>

              </div>

              <div class="summary-item">

                <span class="label">دقیقه:</span>

                <span class="value">${fix.status.elapsed || '-'}</span>

              </div>

              <div class="summary-item">

                <span class="label">داور:</span>

                <span class="value">${fix.referee || 'نامشخص'}</span>

              </div>

              <div class="summary-item">

                <span class="label">محل:</span>

                <span class="value">${fix.venue?.name || 'نامشخص'}</span>

              </div>

            </div>

            

            <div class="teams-overview">

              <div class="team-overview home">

                <h5>${teams.home.name}</h5>

                <div class="team-stats">

                  <span class="stat">گل: ${goals.home ?? 0}</span>

                  <span class="stat">شوت: -</span>

                  <span class="stat">مالکیت: -</span>

                </div>

              </div>

              <div class="team-overview away">

                <h5>${teams.away.name}</h5>

                <div class="team-stats">

                  <span class="stat">گل: ${goals.away ?? 0}</span>

                  <span class="stat">شوت: -</span>

                  <span class="stat">مالکیت: -</span>

                </div>

              </div>

            </div>

          </div>

        `;

        

        $('#overview').html(html);

      },



      loadEventsTab: function(fixtureId) {

        this.fetchAPI('events', { fixture: fixtureId })

          .then(events => {

            if (!events.length) {

              $('#events').html('<p>هیچ رویدادی یافت نشد.</p>');

              return;

            }

            

            const html = events.map(event => `

              <div class="event-item">

                <div class="event-time">${event.time.elapsed}'</div>

                <div class="event-icon">${this.getEventIcon(event.type)}</div>

                <div class="event-details">

                  <div class="event-player">${event.player.name}</div>

                  <div class="event-team">${event.team.name}</div>

                  <div class="event-description">${this.getEventDescription(event)}</div>

                </div>

              </div>

            `).join('');

            

            $('#events').html(html);

          })

          .catch(error => {

            console.error('Error loading events:', error);

            $('#events').html('<p>خطا در بارگذاری رویدادها</p>');

          });

      },



      loadLineupsTab: function(fixtureId) {

        this.fetchAPI('lineups', { fixture: fixtureId })

          .then(lineups => {

            if (!lineups.length) {

              $('#lineups').html('<p>ترکیب در دسترس نیست.</p>');

              return;

            }

            

            const html = lineups.map(team => `

              <div class="team-lineup">

                <h5>${team.team.name}</h5>

                <div class="formation">تشکیلات: ${team.formation}</div>

                <div class="starting-xi">

                  <h6>ترکیب اصلی:</h6>

                  <div class="players-grid">

                    ${team.startXI.map(player => `

                      <div class="player-item">

                        <span class="player-number">${player.player.number}</span>

                        <span class="player-name">${player.player.name}</span>

                        <span class="player-position">${player.pos}</span>

                      </div>

                    `).join('')}

                  </div>

                </div>

                ${team.substitutes.length ? `

                  <div class="substitutes">

                    <h6>نیمکت:</h6>

                    <div class="players-grid">

                      ${team.substitutes.map(player => `

                        <div class="player-item">

                          <span class="player-number">${player.player.number}</span>

                          <span class="player-name">${player.player.name}</span>

                          <span class="player-position">${player.pos}</span>

                        </div>

                      `).join('')}

                    </div>

                  </div>

                ` : ''}

              </div>

            `).join('');

            

            $('#lineups').html(html);

          })

          .catch(error => {

            console.error('Error loading lineups:', error);

            $('#lineups').html('<p>خطا در بارگذاری ترکیب</p>');

          });

      },



      loadStatsTab: function(fixtureId) {

        this.fetchAPI('fixtures/statistics', { fixture: fixtureId })

          .then(stats => {

            if (!stats.length) {

              $('#stats').html('<p>آمار در دسترس نیست.</p>');

              return;

            }

            

            const homeTeam = stats.find(s => s.team.id === stats[0].team.id);

            const awayTeam = stats.find(s => s.team.id !== stats[0].team.id);

            

            const html = `

              <div class="stats-comparison">

                <div class="stats-header">

                  <div class="team-name">${homeTeam.team.name}</div>

                  <div class="team-name">${awayTeam.team.name}</div>

                </div>

                ${this.renderStatsComparison(homeTeam.statistics, awayTeam.statistics)}

              </div>

            `;

            

            $('#stats').html(html);

          })

          .catch(error => {

            console.error('Error loading statistics:', error);

            $('#stats').html('<p>خطا در بارگذاری آمار</p>');

          });

      },



      loadPredictionsTab: function(fixtureId) {

        this.fetchAPI('predictions', { fixture: fixtureId })

          .then(predictions => {

            if (!predictions.length) {

              $('#predictions').html('<p>پیش‌بینی در دسترس نیست.</p>');

              return;

            }

            

            const prediction = predictions[0];

            const html = `

              <div class="predictions-content">

                <h4>پیش‌بینی نتیجه</h4>

                <div class="prediction-item">

                  <span class="label">احتمال برد تیم میزبان:</span>

                  <span class="value">${prediction.predictions.winner?.home || '-'}%</span>

                </div>

                <div class="prediction-item">

                  <span class="label">احتمال برد تیم مهمان:</span>

                  <span class="value">${prediction.predictions.winner?.away || '-'}%</span>

                </div>

                <div class="prediction-item">

                  <span class="label">احتمال تساوی:</span>

                  <span class="value">${prediction.predictions.winner?.draw || '-'}%</span>

                </div>

                <div class="prediction-item">

                  <span class="label">تعداد گل پیش‌بینی شده:</span>

                  <span class="value">${prediction.predictions.goals?.over?.['2.5'] || '-'}</span>

                </div>

              </div>

            `;

            

            $('#predictions').html(html);

          })

          .catch(error => {

            console.error('Error loading predictions:', error);

            $('#predictions').html('<p>خطا در بارگذاری پیش‌بینی</p>');

          });

      },



      loadTeamsTab: function(fixtureId) {

        // Get team IDs from the match details sidebar

        const homeTeamId = $('.match-details-sidebar').attr('data-home-team-id');

        const awayTeamId = $('.match-details-sidebar').attr('data-away-team-id');

        

        if (!homeTeamId || !awayTeamId) {

          $('#match-teams .teams-container').html('<p>اطلاعات تیم‌ها در دسترس نیست.</p>');

          return;

        }



        // Show loading state

        $('.home-team-players .team-players').html('<div class="loading-players">در حال بارگذاری بازیکنان تیم میزبان...</div>');

        $('.away-team-players .team-players').html('<div class="loading-players">در حال بارگذاری بازیکنان تیم میهمان...</div>');



        // Fetch players data for both teams

        Promise.all([

          this.fetchAPI('fixtures/players', { fixture: fixtureId }),

          this.fetchAPI('teams', { id: homeTeamId }),

          this.fetchAPI('teams', { id: awayTeamId })

        ])

        .then(([playersData, homeTeamData, awayTeamData]) => {

          const homeTeam = homeTeamData[0] || {};

          const awayTeam = awayTeamData[0] || {};

          

          // Find players for each team

          const homePlayers = playersData.find(team => team.team.id === parseInt(homeTeamId))?.players || [];

          const awayPlayers = playersData.find(team => team.team.id === parseInt(awayTeamId))?.players || [];

          

          // Render home team players

          const homeHtml = this.renderTeamPlayers(homeTeam, homePlayers, 'home');

          $('.home-team-players .team-players').html(homeHtml);

          

          // Render away team players

          const awayHtml = this.renderTeamPlayers(awayTeam, awayPlayers, 'away');

          $('.away-team-players .team-players').html(awayHtml);

        })

        .catch(error => {

          console.error('Error loading team details:', error);

          const errorHtml = `

            <div class="error-loading">

              <p>خطا در بارگذاری اطلاعات تیم‌ها</p>

              <small>لطفاً دوباره تلاش کنید</small>

            </div>

          `;

          $('#match-teams .teams-container').html(errorHtml);

        });

      },



      renderTeamPlayers: function(team, players, teamType) {

        if (!players.length) {

          return '<div class="no-players">اطلاعات بازیکنان در دسترس نیست</div>';

        }



        // Group players by position

        const goalkeepers = players.filter(p => p.statistics[0]?.games?.position === 'G');

        const defenders = players.filter(p => p.statistics[0]?.games?.position === 'D');

        const midfielders = players.filter(p => p.statistics[0]?.games?.position === 'M');

        const forwards = players.filter(p => p.statistics[0]?.games?.position === 'F');



        let html = `

          <div class="team-info">

            <div class="team-header">

              <img src="${team.logo || 'https://media.api-sports.io/football/teams/default.png'}" alt="${team.name}" class="team-logo-small">

              <span class="team-name">${team.name}</span>

            </div>

          </div>

        `;



        // Add players by position

        if (goalkeepers.length) {

          html += this.renderPlayerGroup('دروازه‌بانان', goalkeepers);

        }

        if (defenders.length) {

          html += this.renderPlayerGroup('مدافعان', defenders);

        }

        if (midfielders.length) {

          html += this.renderPlayerGroup('هافبک‌ها', midfielders);

        }

        if (forwards.length) {

          html += this.renderPlayerGroup('مهاجمان', forwards);

        }



        return html;

      },



      renderPlayerGroup: function(title, players) {

        return `

          <div class="player-group">

            <h6 class="position-title">${title}</h6>

            <div class="players-grid">

              ${players.map(player => `

                <div class="player-card">

                  <div class="player-photo">

                    <img src="${player.player.photo || 'https://media.api-sports.io/football/players/default.png'}" 

                         alt="${player.player.name}" 

                         onerror="this.src='https://media.api-sports.io/football/players/default.png'">

                  </div>

                  <div class="player-info">

                    <div class="player-name">${player.player.name}</div>

                    <div class="player-number">#${player.statistics[0]?.games?.number || '-'}</div>

                    <div class="player-position">${player.statistics[0]?.games?.position || '-'}</div>

                    <div class="player-rating">امتیاز: ${player.statistics[0]?.games?.rating || '-'}</div>

                    <div class="player-minutes">دقیقه: ${player.statistics[0]?.games?.minutes || '-'}</div>

                  </div>

                </div>

              `).join('')}

            </div>

          </div>

        `;

      },



      getEventIcon: function(eventType) {

        const icons = {

          'Goal': '⚽',

          'Card': '🟨',

          'subst': '🔄',

          'Var': '📺'

        };

        return icons[eventType] || '⚽';

      },



      getEventDescription: function(event) {

        if (event.type === 'Goal') {

          return `گل توسط ${event.player.name}`;

        } else if (event.type === 'Card') {

          return `${event.detail === 'Yellow Card' ? 'کارت زرد' : 'کارت قرمز'} برای ${event.player.name}`;

        } else if (event.type === 'subst') {

          return `تعویض: ${event.player.name} جایگزین ${event.assist.name}`;

        }

        return event.detail || 'رویداد';

      },



      renderStatsComparison: function(homeStats, awayStats) {

        const commonStats = ['Ball Possession', 'Total Shots', 'Shots on Goal', 'Shots off Goal', 'Corner Kicks', 'Fouls'];

        

        return commonStats.map(statType => {

          const homeValue = homeStats.find(s => s.type === statType)?.value || '-';

          const awayValue = awayStats.find(s => s.type === statType)?.value || '-';

          

          return `

            <div class="stat-row">

              <div class="stat-value">${homeValue}</div>

              <div class="stat-label">${this.getStatLabel(statType)}</div>

              <div class="stat-value">${awayValue}</div>

            </div>

          `;

        }).join('');

      },



      getStatLabel: function(statType) {

        const labels = {

          'Ball Possession': 'مالکیت توپ',

          'Total Shots': 'شوت‌ها',

          'Shots on Goal': 'شوت به دروازه',

          'Shots off Goal': 'شوت خارج از دروازه',

          'Corner Kicks': 'کرنر',

          'Fouls': 'خطا'

        };

        return labels[statType] || statType;

      },

  

            loadTopLeagues: function() {

        // Show loading state

        $('#top-leagues-list').html('<div class="loading-leagues">در حال بارگذاری لیگ‌های برتر...</div>');

        

        this.fetchAPI('leagues')

          .then(leagues => {

            console.log('Leagues API response:', leagues);

            

            if (!leagues || !leagues.length) {

              $('#top-leagues-list').html('<div class="no-leagues">هیچ لیگی یافت نشد</div>');

              return;

            }

            

            // Get top leagues (major countries) - filter by type instead of is_cup

            const topCountries = ['England', 'Spain', 'Germany', 'Italy', 'France', 'Iran'];

            let topLeagues = leagues.filter(league => 

              topCountries.includes(league.country.name) && league.league.type === 'League'

            );
            
            // Sort leagues by priority (Iran first, then favorites, then others)
            topLeagues = this.sortLeaguesByPriority(topLeagues);
            
            // Limit to 12 leagues
            topLeagues = topLeagues.slice(0, 12);

            

            console.log('Filtered top leagues:', topLeagues);

            

            if (topLeagues.length === 0) {

              $('#top-leagues-list').html('<div class="no-leagues">لیگ‌های برتر یافت نشد</div>');

              return;

            }

            

            const html = topLeagues.map(league => {
              const isFavorite = this.isLeagueFavorite(league.league.id);
              const isIran = league.country.name === 'Iran';
              const favoriteClass = isFavorite ? 'favorite active' : 'favorite';
              const iranClass = isIran ? 'iran-league' : '';
              
              return `
                <div class="league-item ${iranClass}" data-league-id="${league.league.id}">
                  <div class="league-header">
                    <img src="${league.league.logo}" alt="${league.league.name}" class="league-logo" onerror="this.src='https://via.placeholder.com/24x24/ccc/999?text=?'">
                    <div class="league-info">
                      <div class="league-name">${league.league.name}</div>
                      <div class="league-country">${league.country.name}</div>
                    </div>
                  </div>
                  <button class="${favoriteClass}-btn" data-league-id="${league.league.id}" title="${isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}">
                    <i class="fa fa-heart${isFavorite ? '' : '-o'}"></i>
                  </button>
                </div>
              `;
            }).join('');

            

            $('#top-leagues-list').html(html);

            

            // Bind league click events

            this.bindLeagueClickEvents();

          })

          .catch(error => {

            console.error('Error loading top leagues:', error);

            $('#top-leagues-list').html('<div class="error-leagues">خطا در بارگذاری لیگ‌ها: ' + error.message + '</div>');

            

            // Fallback data for testing

            setTimeout(() => {

              const fallbackLeagues = [

                { league: { id: 39, name: 'Premier League', logo: 'https://media.api-sports.io/football/leagues/39.png' }, country: { name: 'England' } },

                { league: { id: 140, name: 'La Liga', logo: 'https://media.api-sports.io/football/leagues/140.png' }, country: { name: 'Spain' } },

                { league: { id: 78, name: 'Bundesliga', logo: 'https://media.api-sports.io/football/leagues/78.png' }, country: { name: 'Germany' } },

                { league: { id: 135, name: 'Serie A', logo: 'https://media.api-sports.io/football/leagues/135.png' }, country: { name: 'Italy' } },

                { league: { id: 61, name: 'Ligue 1', logo: 'https://media.api-sports.io/football/leagues/61.png' }, country: { name: 'France' } }

              ];

              

              const html = fallbackLeagues.map(league => `

                <div class="league-item" data-league-id="${league.league.id}">

                  <img src="${league.league.logo}" alt="${league.league.name}" class="league-logo" onerror="this.src='https://via.placeholder.com/28x28/ccc/999?text=?'">

                  <div class="league-info">

                    <div class="league-name">${league.league.name}</div>

                    <div class="league-country">${league.country.name}</div>

                  </div>

                </div>

              `).join('');

              

              $('#top-leagues-list').html(html);

              this.bindLeagueClickEvents();

            }, 2000);

          });

      },



      loadCountries: function() {

        this.fetchAPI('countries')

          .then(countries => {

            if (!countries.length) return;

            

            // Define priority countries (major football nations) - using country names

            const priorityCountries = [

              'Iran', // ایران

              'England', // انگلیس

              'Spain', // اسپانیا

              'Germany', // آلمان

              'Italy', // ایتالیا

              'France', // فرانسه

              'Brazil', // برزیل

              'Argentina', // آرژانتین

              'Portugal', // پرتغال

              'Netherlands', // هلند

              'Belgium', // بلژیک

              'Croatia', // کرواسی

              'Serbia', // صربستان

              'Switzerland', // سوئیس

              'Denmark', // دانمارک

              'Sweden', // سوئد

              'Norway', // نروژ

              'Poland', // لهستان

              'Czech Republic', // جمهوری چک

              'Austria'  // اتریش

            ];

            

            // Sort countries: priority first, then alphabetically

            const sortedCountries = countries.sort((a, b) => {

              const aPriority = priorityCountries.indexOf(a.name);

              const bPriority = priorityCountries.indexOf(b.name);

              

              // If both are priority countries, maintain their priority order

              if (aPriority !== -1 && bPriority !== -1) {

                return aPriority - bPriority;

              }

              

              // If only one is priority, put it first

              if (aPriority !== -1) return -1;

              if (bPriority !== -1) return 1;

              

              // If neither is priority, sort alphabetically

              return a.name.localeCompare(b.name, 'fa');

            });

            

            const html = sortedCountries.slice(0, 30).map(country => {

              const isPriority = priorityCountries.includes(country.name);

              return `

                <div class="country-item ${isPriority ? 'priority-country' : ''}" data-country-name="${country.name}">

                  <div class="country-flag">

                    <img src="https://flagcdn.com/w20/${country.code.toLowerCase()}.png" 

                         alt="${country.name}" 

                         onerror="this.src='https://via.placeholder.com/20x15/ccc/999?text=${country.code}'">

                  </div>

                  <div class="country-name">${country.name}</div>

                  <div class="country-arrow">›</div>

                  <div class="country-leagues-expanded" style="display: none;">

                    <div class="leagues-loading">در حال بارگذاری لیگ‌ها...</div>

                    <div class="leagues-content"></div>

                  </div>

                </div>

              `;

            }).join('');

            

            $('#countries-list').html(html);

            

            // Bind country click events

            this.bindCountryEvents();

          })

          .catch(error => {

            console.error('Error loading countries:', error);

          });

      },



      loadCountryLeagues: function(countryName) {

        console.log(`🔍 Searching for leagues in ${countryName}...`);

        

        // Find the country item

        const countryItem = $(`.country-item[data-country-name="${countryName}"]`);

        const expandedSection = countryItem.find('.country-leagues-expanded');

        const loadingDiv = countryItem.find('.leagues-loading');

        const contentDiv = countryItem.find('.leagues-content');

        

        // Toggle expanded section

        const isExpanded = expandedSection.is(':visible');

        if (isExpanded) {

          expandedSection.slideUp();

          countryItem.find('.country-arrow').text('›');

          return;

        }

        

        // Show expanded section

        expandedSection.slideDown();

        countryItem.find('.country-arrow').text('⌄');

        

        // Check if content is already loaded

        if (contentDiv.children().length > 0) {

          return;

        }

        

        // Show loading

        loadingDiv.show();

        contentDiv.empty();

        

        // First try without season parameter

        this.fetchAPI('leagues', { country: countryName })

          .then(leagues => {

            console.log(`📊 Found ${leagues.length} leagues for ${countryName}:`, leagues);

            

            if (!leagues.length) {

              // If no leagues found, try with current season

              const currentYear = new Date().getFullYear();

              console.log(`🔄 No leagues found, trying with season ${currentYear}...`);

              return this.fetchAPI('leagues', { country: countryName, season: currentYear });

            }

            return leagues;

          })

          .then(leagues => {

            loadingDiv.hide();

            

            if (!leagues || !leagues.length) {

              console.log(`❌ No leagues found for ${countryName} even with season parameter`);

              contentDiv.html('<div class="no-leagues">هیچ لیگی یافت نشد.</div>');

              return;

            }

            

            console.log(`✅ Successfully loaded ${leagues.length} leagues for ${countryName}`);

            

            const html = leagues.map(league => `

              <div class="country-league-item" data-league-id="${league.league.id}">

                <img src="${league.league.logo}" alt="${league.league.name}" class="league-logo">

                <div class="league-info">

                  <div class="league-name">${league.league.name}</div>

                  <div class="league-type">${league.league.type === 'League' ? 'لیگ' : 'جام'}</div>

                  <div class="league-season">فصل: ${league.seasons ? league.seasons[0].year : 'نامشخص'}</div>

                </div>

              </div>

            `).join('');

            

            contentDiv.html(html);

            

            // Bind league click events for country leagues

            this.bindCountryLeagueClickEvents();

          })

          .catch(error => {

            loadingDiv.hide();

            console.error('❌ Error loading country leagues:', error);

            contentDiv.html('<div class="error-loading">خطا در بارگذاری لیگ‌ها</div>');

          });

      },



      showCountryLeaguesModal: function(countryName, leaguesHtml) {

        const modal = $(`

          <div class="country-leagues-modal" style="display: none;">

            <div class="modal-overlay"></div>

            <div class="modal-content">

              <div class="modal-header">

                <h3>لیگ‌های ${countryName}</h3>

                <button class="close-modal">&times;</button>

              </div>

              <div class="modal-body">

                ${leaguesHtml}

              </div>

            </div>

          </div>

        `);

        

        $('body').append(modal);

        modal.fadeIn();

        

        // Bind close event

        modal.find('.close-modal, .modal-overlay').on('click', () => {

          modal.fadeOut(() => modal.remove());

        });

      },



      bindCountryEvents: function() {

        $('.country-item').on('click', (e) => {

          const countryItem = $(e.currentTarget);

          const countryName = countryItem.data('country-name');

          

          console.log(`Loading leagues for country: ${countryName}`);

          this.loadCountryLeagues(countryName);

        });

      },



      bindCountryLeagueClickEvents: function() {

        // Remove existing event handlers to prevent duplicates

        $(document).off('click', '.country-league-item');

        

        // Bind click events to country league items

        $(document).on('click', '.country-league-item', (e) => {

          e.stopPropagation(); // Prevent country item click

          const leagueItem = $(e.currentTarget);

          const leagueId = leagueItem.data('league-id');

          

          console.log(`Opening league details for ID: ${leagueId}`);

          this.showLeagueDetails(leagueId);

        });

      },



      loadLeagues: function(container) {

        this.showLoading(container, true);

        container.find('.league-list').empty();

        container.find('.no-results').addClass('hidden');



        this.fetchAPI('leagues')

          .then(leagues => {

            if (!leagues.length) {

              container.find('.no-results .text').text('لیگ‌ها یافت نشد.');

              container.find('.no-results').removeClass('hidden');

              return;

            }

            const grouped = this.groupBy(leagues, l => l.country.name);

            const html = Object.entries(grouped).map(([country, leagues]) => `

              <div class="league-group">

                <h3>${country}</h3>

                <ul>

                  ${leagues.map(league => `

                    <li>

                      <a href="#" data-league-id="${league.league.id}" data-season="2025">

                        <img src="${league.league.logo}" alt="${league.league.name}" style="width: 24px;">

                        ${league.league.name}

                      </a>

                    </li>

                  `).join('')}

                </ul>

              </div>

            `).join('');

            container.find('.league-list').html(html);

          })

          .finally(() => this.showLoading(container, false));

      },

  

            initEvents: function() {

        const app = this;

   

        // Livescore page

        $('.football11-app').each(function() {

          const container = $(this);

          const cfg = JSON.parse(container.attr('data-cfg') || '{}');

   

          // Tabs

          container.find('.top-tab-list .tab').on('click', function(e) {

            e.preventDefault();

            container.find('.top-tab-list .tab').removeClass('active');

            $(this).addClass('active');

            let offset = 0;

            if ($(this).data('date') === 'yesterday') offset = -1;

            else if ($(this).data('date') === 'tomorrow') offset = 1;

            app.state.currentDate = offset ? app.getDateString(offset) : cfg.date;

            app.loadMatches(container, app.state.currentDate, app.state.filters);

          });

   

          // Filters

          container.find('.filter-item.region').on('change', function() {

            app.state.filters.country = $(this).val();

            app.loadMatches(container, app.state.currentDate, app.state.filters);

          });

   

          container.find('.filter-item.live').on('click', function(e) {

            e.preventDefault();

            $(this).toggleClass('active');

            app.state.filters.live = $(this).hasClass('active');

            app.loadMatches(container, app.state.currentDate, app.state.filters);

          });

   

          container.find('.filter-item.favorite').on('click', function(e) {

            e.preventDefault();

            $(this).toggleClass('active');

            app.state.filters.favorite = $(this).hasClass('active');

            app.loadMatches(container, app.state.currentDate, app.state.filters);

          });



          // Show details sidebar

          // Details are always visible, no need to toggle
          // container.find('.filter-item.details').on('click', function(e) {

          //   e.preventDefault();

          //   $('.match-details-sidebar').toggle();

          // });

                // Enhanced mobile close button handler with overlay support
      $(document).on('click touchstart', '.close-details', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Close button clicked from initEvents');
        
        // Sidebar is always visible, no need to hide
        // // Hide sidebar with animation
        // $('.match-details-sidebar').removeClass('active show').css('transform', 'translateX(-100%)');
        
        // // Hide overlay if exists
        // $('.sidebar-overlay').removeClass('active');
        
        // // Mobile-specific handling
        // if (window.innerWidth <= 768) {
        //   $('body').removeClass('sidebar-open');
        //   $('.livescore-container').removeClass('sidebar-open');
          
        //   // Remove overlay after animation
        //   setTimeout(() => {
        //     $('.sidebar-overlay').remove();
        //   }, 300);
        // }
      });



          // Initialize main filters (Sofascore style)

          app.initMainFilters(container);



          // Search functionality

          container.find('.search-box-container input').on('keypress', function(e) {

            if (e.which === 13) {

              const searchTerm = $(this).val();

              app.searchMatches(container, searchTerm);

            }

          });



          // Search on input change (with debounce)

          let searchTimeout;

          container.find('.search-box-container input').on('input', function() {

            const searchTerm = $(this).val();

            clearTimeout(searchTimeout);

            

            // Debounce search to avoid too many API calls

            searchTimeout = setTimeout(() => {

              if (searchTerm.length >= 2 || searchTerm.length === 0) {

                app.searchMatches(container, searchTerm);

              }

            }, 500);

          });



          // Search button click

          container.find('.search-box-container button').on('click', function() {

            const searchTerm = container.find('.search-box-container input').val();

            app.searchMatches(container, searchTerm);

          });

   

          // Datepicker (stub)

          container.find('.pwt-btn-today').on('click', () => app.loadMatches(container));

          container.find('.table-days td').on('click', function() {

            app.loadMatches(container, '2025-08-26');

          });

   

          // Initial load

          app.loadMatches(container, cfg.date || app.state.currentDate);

           app.loadTopLeagues();

           app.loadCountries();

           app.initPersianCalendar();
           
           // Initialize favorites system
           app.initFavorites();

           

           // Bind league click events after a short delay to ensure DOM is ready

           setTimeout(() => {

             app.bindLeagueClickEvents();

           }, 1000);
           
           // Initialize infinite scroll after initial load
           setTimeout(() => {
             app.initInfiniteScroll(container);
           }, 1500);



          // Bind match click events

          $(document).on('click', '.match-row', function(e) {

            e.preventDefault();

            const fixtureId = $(this).data('fixture-id');

            if (fixtureId) {

              app.loadMatchDetails(fixtureId);

            }

          });

        });



        // Match Details Panel Events

        this.initMatchDetailsEvents();



        // Initialize main filters

        this.initMainFilters(container);

      },



      initMatchDetailsEvents: function() {

        const app = this;

        

        // Close details sidebar - Use event delegation for better mobile support

        // Close details button is disabled since details are always visible
        // $(document).on('click', '.close-details', function(e) {

        //   e.preventDefault();

        //   e.stopPropagation();

        //   console.log('Close details button clicked');

        //   $('.match-details-sidebar').hide();

        //   $('.match-details-sidebar').removeClass('active');

        // });

        

        // Tab switching in match details

        $('.match-nav-tabs .tab-list a').on('click', function(e) {

          e.preventDefault();

          const tabId = $(this).attr('href');

          

          // Update active tab

          $('.match-nav-tabs .tab-list li').removeClass('active');

          $(this).parent().addClass('active');

          

          // Show active tab content

          $('.tab-content').removeClass('active');

          $(tabId).addClass('active');

          

          // Load tab content if needed

          const fixtureId = app.currentFixtureId;

          if (fixtureId) {

            switch(tabId) {

              case '#match-info':

                // Already loaded

                break;

              case '#match-events':

                app.loadMatchEvents(fixtureId);

                break;

              case '#match-lineups':

                console.log('Loading lineups for fixture:', fixtureId);

                app.loadMatchLineups(fixtureId);

                break;

              case '#match-teams':

                console.log('Loading teams for fixture:', fixtureId);

                app.loadTeamsTab(fixtureId);

                break;

              case '#match-stats':

                app.loadMatchStats(fixtureId);

                break;

            }

          }

        });

      },



      // Load match details when a match is clicked

      loadMatchDetails: function(fixtureId) {

        const app = this;

        

        // Match details are always visible, no need to show/hide
        // $('.match-details-sidebar').show();

        

        // Load basic match info

        this.loadMatchInfo(fixtureId);

        

        // Set current fixture ID

        this.currentFixtureId = fixtureId;

        

        // Show first tab by default

        $('.match-nav-tabs .tab-list li').removeClass('active');

        $('.match-nav-tabs .tab-list li:first').addClass('active');

        $('.tab-content').removeClass('active');

        $('#match-info').addClass('active');

        

        // Initialize horizontal scroll functionality

        this.initHorizontalScroll();

      },



      // Initialize horizontal scroll functionality for match details

      initHorizontalScroll: function() {

        const app = this;

        

        // Add scroll indicators to content sections

        this.addScrollIndicators();

        

        // Bind scroll events for better UX

        $('.match-details-content').on('scroll', function() {

          app.updateScrollIndicators($(this));

        });

        

        // Add touch/swipe support for mobile

        this.addTouchScrollSupport();

      },



      // Add scroll indicators to content sections

      addScrollIndicators: function() {

        // Add left scroll indicator

        if (!$('.scroll-indicator.left').length) {

          $('.match-details-content').append('<div class="scroll-indicator left">‹</div>');

        }

        

        // Add right scroll indicator

        if (!$('.scroll-indicator.right').length) {

          $('.match-details-content').append('<div class="scroll-indicator right">›</div>');

        }

        

        // Update indicators initially

        this.updateScrollIndicators($('.match-details-content'));

      },



      // Update scroll indicators based on scroll position

      updateScrollIndicators: function(container) {

        const scrollLeft = container.scrollLeft();

        const scrollWidth = container[0].scrollWidth;

        const clientWidth = container[0].clientWidth;

        

        // Show/hide left indicator

        if (scrollLeft > 0) {

          container.find('.scroll-indicator.left').show();

        } else {

          container.find('.scroll-indicator.left').hide();

        }

        

        // Show/hide right indicator

        if (scrollLeft < scrollWidth - clientWidth - 1) {

          container.find('.scroll-indicator.right').show();

        } else {

          container.find('.scroll-indicator.right').hide();

        }

      },



      // Add touch scroll support for mobile devices

      addTouchScrollSupport: function() {

        let startX = 0;

        let startY = 0;

        let scrollLeft = 0;

        let scrollTop = 0;

        let isScrolling = false;

        

        $('.match-details-content').on('touchstart', function(e) {

          const touch = e.originalEvent.touches[0];

          startX = touch.clientX;

          startY = touch.clientY;

          scrollLeft = this.scrollLeft;

          scrollTop = this.scrollTop;

          isScrolling = false;

        });

        

        $('.match-details-content').on('touchmove', function(e) {

          if (!startX || !startY) return;

          

          const touch = e.originalEvent.touches[0];

          const deltaX = startX - touch.clientX;

          const deltaY = startY - touch.clientY;

          

          // Determine if this is a horizontal scroll

          if (Math.abs(deltaX) > Math.abs(deltaY)) {

            e.preventDefault();

            this.scrollLeft = scrollLeft + deltaX;

            isScrolling = true;

          }

        });

        

        $('.match-details-content').on('touchend', function(e) {

          startX = 0;

          startY = 0;

          

          // Add momentum scrolling effect

          if (isScrolling) {

            this.style.scrollBehavior = 'smooth';

            setTimeout(() => {

              this.style.scrollBehavior = 'auto';

            }, 300);

          }

        });

      },



      // Load basic match information

      loadMatchInfo: function(fixtureId) {

        const url = `${this.config.api.base}/fixtures?id=${fixtureId}`;

        

        fetch(url, {

          headers: {

            'x-rapidapi-key': this.config.api.key,

            'x-rapidapi-host': this.config.api.host

          }

        })

        .then(response => response.json())

        .then(data => {

          if (data.response && data.response.length > 0) {

            const match = data.response[0];

            this.displayMatchInfo(match);

          }

        }) 

        .catch(error => {

          console.error('Error loading match info:', error);

        });

      },



      // Display match information

      displayMatchInfo: function(match) {

        // Update team names and logos with fallback

        $('.match-details-sidebar .home-team .team-name').text(match.teams.home.name);

        $('.match-details-sidebar .away-team .team-name').text(match.teams.away.name);

        

        if (match.teams.home.logo) {

          $('.match-details-sidebar .home-team .team-logo').attr('src', match.teams.home.logo);

        } else {

          $('.match-details-sidebar .home-team .team-logo').attr('src', 'https://media.api-sports.io/football/teams/default.png');

        }

        

        if (match.teams.away.logo) {

          $('.match-details-sidebar .away-team .team-logo').attr('src', match.teams.away.logo);

        } else {

          $('.match-details-sidebar .away-team .team-logo').attr('src', 'https://media.api-sports.io/football/teams/default.png');

        }

        

        // Update score - handle both goals and score objects

        let scoreText = '';

        if (match.goals && match.goals.home !== null && match.goals.away !== null) {

          scoreText = `${match.goals.home} - ${match.goals.away}`;

        } else if (match.fixture.score && match.fixture.score.fulltime) {

          scoreText = `${match.fixture.score.fulltime.home || 0} - ${match.fixture.score.fulltime.away || 0}`;

        } else {

          scoreText = '0 - 0';

        }

        $('.match-details-sidebar .match-score .score').text(scoreText);

        

        // Update match time

        const matchTime = new Date(match.fixture.date);

        const timeString = matchTime.toLocaleTimeString('fa-IR', { 

          hour: '2-digit', 

          minute: '2-digit' 

        });

        $('.match-details-sidebar .match-score .match-time').text(timeString);

        

        // Update info section with all available data

        $('.match-details-sidebar .info-list .info-value').eq(0).text(match.league.name);

        $('.match-details-sidebar .info-list .info-value').eq(1).text(match.league.season);

        $('.match-details-sidebar .info-list .info-value').eq(2).text(match.league.round || 'مرحله عادی');

        $('.match-details-sidebar .info-list .info-value').eq(3).text(timeString);

        $('.match-details-sidebar .info-list .info-value').eq(4).text(this.getMatchStatus(match.fixture.status.short));

        

        // Add team IDs for future reference

        $('.match-details-sidebar').attr('data-home-team-id', match.teams.home.id);

        $('.match-details-sidebar').attr('data-away-team-id', match.teams.away.id);

        

        // Log match data for debugging

        console.log('Match data loaded:', match);

      },



      // Load match events

      loadMatchEvents: function(fixtureId) {

        const url = `${this.config.api.base}/fixtures/events?fixture=${fixtureId}`;

        

        fetch(url, {

          headers: {

            'x-rapidapi-key': this.config.api.key,

            'x-rapidapi-host': this.config.api.host

          }

        })

        .then(response => response.json())

        .then(data => {

          if (data.response && data.response.length > 0) {

            this.displayMatchEvents(data.response);

          } else {

            $('.events-timeline').html('<div class="no-events">هنوز رویدادی ثبت نشده</div>');

          }

        })

        .catch(error => {

          console.error('Error loading match events:', error);

        });

      },



      // Display match events

      displayMatchEvents: function(events) {

        let eventsHtml = '';

        

        events.forEach(event => {

          const eventTime = event.time.elapsed || 0;

          const eventIcon = this.getEventIcon(event.type);

          const eventText = this.getEventText(event);

          

          eventsHtml += `

            <div class="event-item">

              <div class="event-time">${eventTime}'</div>

              <div class="event-icon">${eventIcon}</div>

              <div class="event-text">${eventText}</div>

            </div>

          `;

        });

        

        $('.events-timeline').html(eventsHtml);

      },



      // Load match lineups

      loadMatchLineups: function(fixtureId) {

        console.log('loadMatchLineups called with fixtureId:', fixtureId);

        const url = `${this.config.api.base}/fixtures/lineups?fixture=${fixtureId}`;

        console.log('Fetching from URL Tarkib3: ', url);

        

        fetch(url, {

          headers: {

            'x-rapidapi-key': this.config.api.key,

            'x-rapidapi-host': this.config.api.host

          }

        })

        .then(response => {

          console.log('Lineups API response status:', response.status);

          return response.json();

        })

        .then(data => {

          console.log('Lineups API data:', data);

          console.log('line up zae:' ,data.response.length)

          if (data.response && data.response.length > 0 && data.response[0].startXI && data.response[0].startXI.length > 0) {

            this.displayMatchLineups(data.response);

          } else {

            $('.home-lineup .lineup-players').html('<div class="no-lineup">ترکیب هنوز اعلام نشده</div>');

            $('.away-lineup .lineup-players').html('<div class="no-lineup">ترکیب هنوز اعلام نشده</div>');

          }

        })

        .catch(error => {

          console.error('Error loading match lineups:', error);

        });

      },



      // Display match lineups

      displayMatchLineups: function(lineups) {

        console.log('Displaying lineups:', lineups);

        

        if (!lineups || lineups.length === 0) {

          console.log('No lineups data available');

          return;

        }

        

        // Try to determine which team is home/away based on team names

        const homeTeamName = $('.match-details-sidebar .home-team .team-name').text();

        const awayTeamName = $('.match-details-sidebar .away-team .team-name').text();

        

        let homeLineup = null;

        let awayLineup = null;

        

        // Find home and away lineups

        lineups.forEach(lineup => {

          if (lineup.team.name === homeTeamName || lineup.team.name.includes(homeTeamName)) {

            homeLineup = lineup;

          } else if (lineup.team.name === awayTeamName || lineup.team.name.includes(awayTeamName)) {

            awayLineup = lineup;

          }

        });

        

        // If we can't determine, use first two lineups

        if (!homeLineup && !awayLineup && lineups.length >= 2) {

          homeLineup = lineups[0];

          awayLineup = lineups[1];

        }

        

        // Display home team lineup on field

        if (homeLineup) {

          this.displayTeamLineupOnField('home', homeLineup);

        }

        

        // Display away team lineup on field

        if (awayLineup) {

          this.displayTeamLineupOnField('away', awayLineup);

        }

      },



      // Display team lineup on football field

      displayTeamLineupOnField: function(teamType, lineup) {

        const fieldId = `#${teamType}-field`;

        const field = $(fieldId);

        

        if (!field.length) return;

        

        // Clear existing field

        field.empty();

        

        // Get starting XI players

        const startingXI = lineup.startXI || [];

        const substitutes = lineup.substitutes || [];

        const formation = lineup.formation || '4-4-2';

        

        // Update formation info

        $(`.${teamType}-lineup .formation-info`).text(`ترکیب: ${formation}`);

        

        // Parse formation (e.g., "4-4-2" -> [4, 4, 2])

        const formationParts = formation.split('-').map(num => parseInt(num));

        

        // Position players on field

        this.positionPlayersOnField(field, startingXI, formationParts, teamType);

        

        // Display substitutes list

        this.displaySubstitutes(teamType, substitutes);

      },



      // Position players on the football field

      positionPlayersOnField: function(field, players, formation, teamType) {

        if (!players || players.length === 0) return;

        

        // Calculate player positions based on formation

        let playerIndex = 0;

        

        // Add goalkeeper (always in the middle of the goal line)

        if (players[playerIndex]) {

          const goalkeeper = players[playerIndex];

          const goalkeeperElement = this.createPlayerElement(goalkeeper, 'goalkeeper', teamType);

          field.append(goalkeeperElement);

          

          // Position goalkeeper in the middle of the bottom row

          goalkeeperElement.css({

            'grid-row': '6',

            'grid-column': '3'

          });

          

          playerIndex++;

        }

        

        // Position other players based on formation

        for (let i = 0; i < formation.length; i++) {

          const playersInRow = formation[i];

          const row = i + 1;

          

          // Center players in their rows

          const maxCols = 5;

          const startCol = Math.max(1, Math.floor((maxCols - playersInRow) / 2) + 1);

          

          for (let j = 0; j < playersInRow && playerIndex < players.length; j++) {

            const player = players[playerIndex];

            const playerElement = this.createPlayerElement(player, this.getPlayerPosition(row), teamType);

            field.append(playerElement);

            

            // Position player on grid

            playerElement.css({

              'grid-row': row,

              'grid-column': startCol + j

            });

            

            playerIndex++;

          }

        }

      },



      // Create player element for the field

      createPlayerElement: function(player, position, teamType) {

        const playerDiv = $('<div>', {

          class: `player-circle ${position}`,

          'data-player-id': player.player.id

        });

        

        // Add player number

        playerDiv.append($('<span>', {

          class: 'player-number',

          text: player.player.number || '?'

        }));

        

        // Add player info tooltip

        const playerInfo = $('<div>', {

          class: 'player-info',

          text: `${player.player.name} (${this.getPositionText(position)})`

        });

        playerDiv.append(playerInfo);

        

        // Add player name below circle

        const playerName = $('<div>', {

          class: 'player-name',

          text: this.truncateName(player.player.name, 8)

        });

        playerDiv.append(playerName);

        

        // Add position below name

        const playerPosition = $('<div>', {

          class: 'player-position',

          text: this.getPositionText(position)

        });

        playerDiv.append(playerPosition);

        

        // Fetch player photo

        this.fetchPlayerPhoto(player.player.id, playerDiv);

        

        return playerDiv;

      },



      // Get player position based on row

      getPlayerPosition: function(row) {

        if (row === 1) return 'forward';

        if (row === 2) return 'midfielder';

        if (row === 3) return 'midfielder';

        if (row === 4) return 'defender';

        if (row === 5) return 'defender';

        return 'defender';

      },



      // Get position text in Persian

      getPositionText: function(position) {

        const positionMap = {

          'goalkeeper': 'دروازه بان',

          'defender': 'مدافع',

          'midfielder': 'هافبک',

          'forward': 'مهاجم'

        };

        return positionMap[position] || position;

      },



      // Truncate player name for display

      truncateName: function(name, maxLength) {

        if (name.length <= maxLength) return name;

        return name.substring(0, maxLength) + '...';

      },



      // Fetch player photo from API

      fetchPlayerPhoto: function(playerId, playerElement) {

        const url = `${this.config.api.base}/players?id=${playerId}`;

        

        fetch(url, {

          headers: {

            'x-rapidapi-key': this.config.api.key,

            'x-rapidapi-host': this.config.api.host

          }

        })

        .then(response => response.json())

        .then(data => {

          if (data.response && data.response.length > 0) {

            const player = data.response[0];

            if (player.player.photo) {

              // Update player circle with photo

              playerElement.css({

                'background-image': `url(${player.player.photo})`,

                'background-size': 'cover',

                'background-position': 'center'

              });

            }

          }

        })

        .catch(error => {

          console.error('Error fetching player photo:', error);

        });

      },



      // Load match stats

      loadMatchStats: function(fixtureId) {

        // For now, we'll use placeholder stats

        // In a real implementation, you would fetch stats from the API

        this.displayMatchStats({

          possession: { home: 55, away: 45 },

          shots: { home: 8, away: 6 },

          shotsOnTarget: { home: 4, away: 3 }

        });

      },



      // Display match stats

      displayMatchStats: function(stats) {

        // Update possession

        $('.stat-row:eq(0) .stat-bar.home').css('width', stats.possession.home + '%').text(stats.possession.home + '%');

        $('.stat-row:eq(0) .stat-bar.away').css('width', stats.possession.away + '%').text(stats.possession.away + '%');

        

        // Update shots

        $('.stat-row:eq(1) .stat-bar.home').css('width', stats.shots.home + '%').text(stats.shots.home);

        $('.stat-row:eq(1) .stat-bar.away').css('width', stats.shots.away + '%').text(stats.shots.away);

        

        // Update shots on target

        $('.stat-row:eq(2) .stat-bar.home').css('width', stats.shotsOnTarget.home + '%').text(stats.shotsOnTarget.home);

        $('.stat-row:eq(2) .stat-bar.away').css('width', stats.shotsOnTarget.away + '%').text(stats.shotsOnTarget.away);

      },



      // Get match status text

      getMatchStatus: function(status) {

        const statusMap = {

          'NS': 'شروع نشده',

          '1H': 'نیمه اول',

          'HT': 'استراحت',

          '2H': 'نیمه دوم',

          'FT': 'پایان',

          'AET': 'پایان (اضافه)',

          'PEN': 'پنالتی',

          'BT': 'قبل از شروع',

          'SUSP': 'معلق',

          'INT': 'متوقف',

          'PST': 'به تعویق افتاده',

          'CANC': 'لغو شده',

          'ABD': 'متوقف شده',

          'AWD': 'تکنیکی',

          'WO': 'بدون بازی'

        };

        

        return statusMap[status] || status;

      },



      // Get event icon

      getEventIcon: function(eventType) {

        const iconMap = {

          'Goal': '⚽',

          'Card': '🟨',

          'subst': '🔄',

          'Var': '📺'

        };

        

        return iconMap[eventType] || '•';

      },



      // Get event text

      getEventText: function(event) {

        switch(event.type) {

          case 'Goal':

            return `گل توسط ${event.player.name}`;

          case 'Card':

            return `${event.detail === 'Yellow Card' ? 'کارت زرد' : 'کارت قرمز'} برای ${event.player.name}`;

          case 'subst':

            return `تعویض: ${event.player.name} جایگزین ${event.assist.name}`;

          default:

            return event.comments || 'رویداد';

        }

      },



      // Load additional team information

      loadTeamInfo: function(teamId) {

        return this.fetchAPI('teams', { id: teamId })

          .then(teams => {

            if (teams && teams.length > 0) {

              return teams[0];

            }

            return null;

          })

          .catch(error => {

            console.error('Error loading team info:', error);

            return null;

          });

      },



      // Load team statistics

      loadTeamStats: function(teamId, leagueId, season) {

        return this.fetchAPI('teams/statistics', { 

          team: teamId, 

          league: leagueId, 

          season: season 

        })

          .then(stats => {

            if (stats && stats.length > 0) {

              return stats[0];

            }

            return null;

          })

          .catch(error => {

            console.error('Error loading team stats:', error);

            return null;

          });

      },



      // Enhanced match details with team info

      loadEnhancedMatchDetails: function(fixtureId) {

        this.showLoading($('.football11-app'), true);

        

        this.fetchAPI('fixtures', { id: fixtureId })

          .then(fixtures => {

            if (!fixtures.length) return;

            

            const fixture = fixtures[0];

            this.updateMatchHeader(fixture);

            

            // Load additional team information

            const homeTeamId = fixture.teams.home.id;

            const awayTeamId = fixture.teams.away.id;

            const leagueId = fixture.league.id;

            const season = fixture.league.season;

            

            // Load team stats in parallel

            Promise.all([

              this.loadTeamStats(homeTeamId, leagueId, season),

              this.loadTeamStats(awayTeamId, leagueId, season)

            ]).then(([homeStats, awayStats]) => {

              if (homeStats) {

                this.displayTeamStats(homeStats, 'home');

              }

              if (awayStats) {

                this.displayTeamStats(awayStats, 'away');

              }

            });

          })

          .finally(() => {

            this.showLoading($('.football11-app'), false);

          });

      },



      // Display team statistics

      displayTeamStats: function(stats, teamType) {

        const container = $(`.${teamType}-team`);

        

        if (stats.statistics && stats.statistics.length > 0) {

          const teamStats = stats.statistics[0];

          

          // You can add more detailed stats here

          console.log(`${teamType} team stats:`, teamStats);

        }

      },



      // Helper function to get team logo URL with fallback

      getTeamLogoUrl: function(teamLogo, teamName) {

        if (teamLogo && teamLogo.trim() !== '') {

          return teamLogo;

        }

        

        // If no logo, try to construct a default URL based on team name

        // This is a fallback for teams that might not have logos in the API

        const sanitizedName = teamName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        return `https://media.api-sports.io/football/teams/default.png`;

      },



      // Enhanced renderMatchRow with better logo handling

      renderMatchRowEnhanced: function(fixture) {

        const { teams, goals, fixture: fix, league } = fixture;

        const status = fix.status.short;

        const time = new Date(fix.date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

        const scoreDisplay = status === 'NS' ? time : `${goals.home ?? '-'} - ${goals.away ?? '-'}`;

        const liveIndicator = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT'].includes(status) ? '<span class="live-indicator">(زنده)</span>' : '';

        



        

        // Add team ID for better tracking

        const homeTeamId = teams.home.id;

        const awayTeamId = teams.away.id;

        

        // Get team logo URLs with fallbacks

        const homeTeamLogo = this.getTeamLogoUrl(teams.home.logo, teams.home.name);

        const awayTeamLogo = this.getTeamLogoUrl(teams.away.logo, teams.away.name);

        

        // Create compact professional match row

        const html = `

          <div class="match-row" data-fixture-id="${fix.id}" data-home-team-id="${homeTeamId}" data-away-team-id="${awayTeamId}">

            <div class="match-time">${time}</div>

            <div class="match-teams">

              <div class="team home-team">

                <img class="team-logo" src="${homeTeamLogo}" alt="${teams.home.name}" onerror="this.src='https://media.api-sports.io/football/teams/default.png'">

                <span class="team-name">${teams.home.name}</span>

              </div>

              <div class="team away-team">

                <img class="team-logo" src="${awayTeamLogo}" alt="${teams.away.name}" onerror="this.src='https://media.api-sports.io/football/teams/default.png'">

                <span class="team-name">${teams.away.name}</span>

              </div>

            </div>

            <div class="match-score">${scoreDisplay}</div>

            <div class="match-actions">

              <button class="favorite-btn" data-fixture-id="${fix.id}">

                <i class="fa fa-star-o"></i>

              </button>

            </div>

          </div>

        `;

        

        return html;

      },







      init: function() {

        this.initEvents();

        this.initResponsive(); // Initialize responsive behavior

      },



      // League Details Modal Functions

      // Simple function to show league details in sidebar
      showLeagueInSidebar: function(leagueId) {
        if (!leagueId) return;
        
        // Hide match details first
        $('.match-details-sidebar').hide();
        
        // Show league details section
        $('#league-details-section').show();

        // Set current league ID
        this.currentLeagueId = leagueId;

        // Load basic league info
        this.loadLeagueInfo(leagueId);

        // Set default tab to overview
        $('.league-nav-tabs .tab-list li').removeClass('active');
        $('.league-nav-tabs .tab-list li:first').addClass('active');
        $('.league-details-section .tab-content').removeClass('active');
        $('#league-overview').addClass('active');
        
        // Bind close event
        this.bindCloseLeagueDetails();
        
        console.log('League details shown for:', leagueId);
      },
      
      // Function to bind close league details event
      bindCloseLeagueDetails: function() {
        const app = this;
        
        // Remove existing handler to prevent duplicates
        $('.close-league-details').off('click');
        
        // Bind close event
        $('.close-league-details').on('click', function(e) {
          e.preventDefault();
          $('#league-details-section').hide();
          $('.match-details-sidebar').show(); // Show match details again
          console.log('League details closed');
        });
      },



      loadLeagueInfo: function(leagueId) {

        console.log('Loading league info for:', leagueId);

        

        // Load basic league information

        this.fetchAPI('leagues', { id: leagueId })

          .then(leagues => {

            if (!leagues.length) return;

            

            const league = leagues[0];

            console.log('League data:', league);

            

            // Update sidebar header

            $('#sidebar-league-logo').attr('src', league.league.logo);

            $('#sidebar-league-name').text(league.league.name);

            $('#sidebar-league-country').text(league.country.name);

            $('#sidebar-league-type').text(league.league.type === 'League' ? 'لیگ' : 'جام');

            

            // Load seasons

            this.loadLeagueSeasons(leagueId, league.seasons);

            

            // Don't load overview here - it will be loaded by showLeagueDetails

            console.log('✅ League info loaded successfully');

          })

          .catch(error => {

            console.error('Error loading league info:', error);

          });

      },



      loadLeagueSeasons: function(leagueId, seasons) {

        const seasonSelector = $('#sidebar-season-selector');

        seasonSelector.empty();

        

        if (seasons && seasons.length > 0) {

          seasons.forEach(season => {

            const option = `<option value="${season.year}">${season.year}</option>`;

            seasonSelector.append(option);

          });

          

          // Set current season as default

          const currentYear = new Date().getFullYear();

          const currentSeason = seasons.find(s => s.year === currentYear) || seasons[0];

          seasonSelector.val(currentSeason.year);

          

          // Load data for selected season

          this.loadSeasonData(leagueId, currentSeason.year);

          console.log('✅ Season data loaded for:', currentSeason.year);

        }

      },



      loadSeasonData: function(leagueId, season) {

        console.log('🔄 Loading season data for league:', leagueId, 'season:', season);

        

        // Only load overview tab initially, other tabs will be loaded when clicked

        this.loadLeagueOverview(leagueId, season);

        console.log('✅ Season data loaded for overview tab');

      },



      loadLeagueOverview: function(leagueId, season) {

        const currentSeason = season || $('#sidebar-season-selector').val();

        

        console.log('🔄 Loading league overview for league:', leagueId, 'season:', currentSeason);

        console.log('🔍 League details section visible:', $('#league-details-section').is(':visible') ? 'Yes' : 'No');

        console.log('🔍 Overview tab visible:', $('#league-overview').hasClass('active') ? 'Yes' : 'No');

        

        this.fetchAPI('leagues', { id: leagueId, season: currentSeason })

          .then(leagues => {

            console.log('League overview response:', leagues);

            

            if (!leagues.length) {

              $('#season-details').html('<p>اطلاعات لیگ در دسترس نیست.</p>');

              return;

            }

            

            const league = leagues[0];

            console.log('League data for overview:', league);

            

            // Try to find season info from multiple sources

            let seasonInfo = null;

            

            // First try: direct seasons array

            if (league.seasons && league.seasons.length > 0) {

              seasonInfo = league.seasons.find(s => s.year == currentSeason);

              console.log('Found season info from seasons array:', seasonInfo);

            }

            

            // Second try: if no season info found, create basic info

            if (!seasonInfo) {

              seasonInfo = {

                year: currentSeason,

                start: 'نامشخص',

                end: 'نامشخص',

                current: true

              };

              console.log('Created basic season info:', seasonInfo);

            }

            

            // Create overview HTML

            const overviewHtml = `

              <div class="season-details">

                <div class="detail-item">

                  <span class="label">تورنمنت:</span>

                  <span class="value">${league.league?.name || 'نامشخص'}</span>

                </div>

                <div class="detail-item">

                  <span class="label">فصل:</span>

                  <span class="value">${seasonInfo.year}</span>

                </div>

                <div class="detail-item">

                  <span class="label">مرحله:</span>

                  <span class="value">${league.league?.round || 'مرحله عادی'}</span>

                </div>

                <div class="detail-item">

                  <span class="label">شروع:</span>

                  <span class="value">${seasonInfo.start}</span>

                </div>

                <div class="detail-item">

                  <span class="label">وضعیت:</span>

                  <span class="value">${seasonInfo.current ? 'جاری' : 'پایان یافته'}</span>

                </div>

                <div class="detail-item">

                  <span class="label">کشور:</span>

                  <span class="value">${league.country?.name || 'نامشخص'}</span>

                </div>

                <div class="detail-item">

                  <span class="label">نوع:</span>

                  <span class="value">${league.league?.type === 'League' ? 'لیگ' : 'جام'}</span>

                </div>

              </div>

            `;

            

            console.log('📝 Setting overview HTML:', overviewHtml);

            console.log('🔍 Target element season-details:', $('#season-details').length ? 'Found' : 'NOT FOUND');

            console.log('🔍 Overview tab HTML:', $('#overview-tab').html());

            $('#season-details').html(overviewHtml);

            console.log('✅ Overview HTML set successfully');

            

            // Verify the content was set

            const content = $('#season-details').html();

            console.log('🔍 Content verification:', content ? 'Content set' : 'No content');

            

            // Check if the content is visible

            const isVisible = $('#season-details').is(':visible');

            console.log('🔍 Content visibility:', isVisible);

            

            // Additional debugging after content is set

            const seasonDetails = $('#season-details');

            if (seasonDetails.length) {

              console.log('🔍 After setting HTML - Season details computed styles:');

              console.log('  - Display:', seasonDetails.css('display'));

              console.log('  - Visibility:', seasonDetails.css('visibility'));

              console.log('  - Opacity:', seasonDetails.css('opacity'));

              console.log('  - Height:', seasonDetails.css('height'));

              console.log('  - Width:', seasonDetails.css('width'));

              console.log('  - Position:', seasonDetails.css('position'));

              

              // Check parent visibility

              const parentTab = seasonDetails.closest('.tab-panel');

              console.log('🔍 Parent tab active class:', parentTab.hasClass('active'));

              console.log('🔍 Parent tab display:', parentTab.css('display'));

              console.log('🔍 Parent tab visible:', parentTab.is(':visible'));

              

              // Force visibility if needed

              if (!seasonDetails.is(':visible')) {

                console.log('⚠️ Season details not visible, forcing display...');

                seasonDetails.css('display', 'block');

                seasonDetails.css('visibility', 'visible');

                seasonDetails.css('opacity', '1');

              }

              

              if (!parentTab.is(':visible')) {

                console.log('⚠️ Parent tab not visible, forcing display...');

                parentTab.css('display', 'block');

              }

              

              // Final visibility check

              setTimeout(() => {

                console.log('🔍 Final visibility check after forcing:');

                console.log('  - Season details visible:', seasonDetails.is(':visible'));

                console.log('  - Parent tab visible:', parentTab.is(':visible'));

                console.log('  - Season details display:', seasonDetails.css('display'));

                console.log('  - Parent tab display:', parentTab.css('display'));

              }, 100);

            }

          })

          .catch(error => {

            console.error('Error loading league overview:', error);

            $('#season-details').html('<p>خطا در بارگذاری اطلاعات لیگ</p>');

          });

      },



      loadLeagueStandings: function(leagueId, season) {

        const currentSeason = season || $('#season-selector').val();

        

        console.log('🔄 Loading standings for league:', leagueId, 'season:', currentSeason);

        console.log('📍 Target element:', $('#standings-table').length ? 'Found' : 'NOT FOUND');

        

        // Show loading state

        $('#standings-table').html('<div style="text-align: center; padding: 20px;">در حال بارگذاری جدول رده‌بندی...</div>');

        

        this.fetchAPI('standings', { league: leagueId, season: currentSeason })

          .then(standings => {

            console.log('📊 Standings API response:', standings);

            console.log('📊 Response type:', typeof standings);

            console.log('📊 Response length:', standings?.length);

            

            if (!standings || !standings.length) {

              console.log('❌ No standings data received');

              $('#standings-table').html('<p>جدول رده‌بندی در دسترس نیست.</p>');

              return;

            }

            

            // Check different possible structures

            let table = null;

            console.log('🔍 Checking standings structure...');

            

            if (standings[0].league && standings[0].league.standings) {

              table = standings[0].league.standings[0];

              console.log('✅ Found standings in league.standings[0]');

            } else if (standings[0].standings) {

              table = standings[0].standings[0];

              console.log('✅ Found standings in standings[0]');

            } else if (standings[0].response && standings[0].response.standings) {

              table = standings[0].response.standings[0];

              console.log('✅ Found standings in response.standings[0]');

            } else {

              // Try to find standings in the response

              console.log('🔍 Searching for standings in response...');

              for (let item of standings) {

                console.log('🔍 Checking item:', item);

                if (item.standings && item.standings.length > 0) {

                  table = item.standings[0];

                  console.log('✅ Found standings in item.standings[0]');

                  break;

                }

              }

            }

            

            if (!table) {

              console.log('❌ No standings table found in response');

              console.log('🔍 Full response structure:', JSON.stringify(standings, null, 2));

              $('#standings-table').html('<p>جدول رده‌بندی در دسترس نیست.</p>');

              return;

            }

            

            console.log('✅ Standings table found:', table);

            console.log('📊 Table length:', table.length);

            

            let standingsHtml = `

              <table class="standings-table">

                <thead>

                  <tr>

                    <th>رتبه</th>

                    <th>تیم</th>

                    <th>بازی</th>

                    <th>برد</th>

                    <th>مساوی</th>

                    <th>باخت</th>

                    <th>گل زده</th>

                    <th>گل خورده</th>

                    <th>تفاضل</th>

                    <th>امتیاز</th>

                    <th>فرم</th>

                  </tr>

                </thead>

                <tbody>

            `;

            

            table.forEach((team, index) => {

              console.log(`🏃‍♂️ Processing team ${index + 1}:`, team);

              standingsHtml += `

                <tr>

                  <td>${team.rank || '-'}</td>

                  <td>

                    <img src="${team.team?.logo || 'https://media.api-sports.io/football/teams/default.png'}" 

                         alt="${team.team?.name || 'نامشخص'}" 

                         style="width: 24px; vertical-align: middle;">

                    ${team.team?.name || 'نامشخص'}

                  </td>

                  <td>${team.all?.played || 0}</td>

                  <td>${team.all?.win || 0}</td>

                  <td>${team.all?.draw || 0}</td>

                  <td>${team.all?.lose || 0}</td>

                  <td>${team.all?.goals?.for || 0}</td>

                  <td>${team.all?.goals?.against || 0}</td>

                  <td>${team.goalsDiff || 0}</td>

                  <td>${team.points || 0}</td>

                  <td>${team.form ? team.form.split('').map(f => `<span class="form-${f.toLowerCase()}">${f}</span>`).join('') : '-'}</td>

                </tr>

              `;

            });

            

            standingsHtml += '</tbody></table>';

            console.log('📝 Generated HTML length:', standingsHtml.length);

            console.log('📍 Setting HTML to standings-table element');

            

            $('#standings-table').html(standingsHtml);

            console.log('✅ Standings table HTML set successfully');

          })

          .catch(error => {

            console.error('❌ Error loading standings:', error);

            $('#standings-table').html('<p>خطا در بارگذاری جدول رده‌بندی</p>');

          });

      },



      loadLeagueTeams: function(leagueId, season) {

        const currentSeason = season || $('#season-selector').val();

        

        console.log('Loading teams for league:', leagueId, 'season:', currentSeason);

        

        this.fetchAPI('teams', { league: leagueId, season: currentSeason })

          .then(teams => {

            console.log('Teams response:', teams);

            

            if (!teams.length) {

              $('#teams-grid').html('<p>تیم‌ها در دسترس نیستند.</p>');

              return;

            }

            

            let teamsHtml = '';

            teams.forEach(team => {

              teamsHtml += `

                <div class="team-card">

                  <img src="${team.team?.logo || 'https://media.api-sports.io/football/teams/default.png'}" 

                       alt="${team.team?.name || 'نامشخص'}" 

                       class="team-logo"

                       onerror="this.src='https://media.api-sports.io/football/teams/default.png'">

                  <div class="team-name">${team.team?.name || 'نامشخص'}</div>

                  <div class="team-stats">

                    <span>کشور: ${team.team?.country || 'نامشخص'}</span>

                    ${team.venue?.name ? `<br><span>محل: ${team.venue.name}</span>` : ''}

                  </div>

                </div>

              `;

            });

            

            $('#teams-grid').html(teamsHtml);

          })

          .catch(error => {

            console.error('Error loading teams:', error);

            $('#teams-grid').html('<p>خطا در بارگذاری تیم‌ها</p>');

          });

      },



      loadLeagueFixtures: function(leagueId, season) {

        const currentSeason = season || $('#season-selector').val();

        

        console.log('Loading fixtures for league:', leagueId, 'season:', currentSeason);

        

        this.fetchAPI('fixtures', { league: leagueId, season: currentSeason })

          .then(fixtures => {

            console.log('Fixtures response:', fixtures);

            

            if (!fixtures.length) {

              $('#fixtures-list').html('<p>مسابقات در دسترس نیستند.</p>');

              return;

            }

            

            let fixturesHtml = '';

            fixtures.slice(0, 20).forEach(fixture => { // Show first 20 fixtures

              const matchTime = new Date(fixture.fixture.date).toLocaleDateString('fa-IR');

              const status = this.getMatchStatus(fixture.fixture.status.short);

              

              fixturesHtml += `

                <div class="fixture-item">

                  <div class="fixture-teams">

                    <span>${fixture.teams?.home?.name || 'نامشخص'}</span>

                    <span>vs</span>

                    <span>${fixture.teams?.away?.name || 'نامشخص'}</span>

                  </div>

                  <div class="fixture-time">

                    <div>${matchTime}</div>

                    <div>${status}</div>

                  </div>

                </div>

              `;

            });

            

            $('#fixtures-list').html(fixturesHtml);

          })

          .catch(error => {

            console.error('Error loading fixtures:', error);

            $('#fixtures-list').html('<p>خطا در بارگذاری مسابقات</p>');

          });

      },



      loadLeagueRounds: function(leagueId, season) {

        const currentSeason = season || $('#season-selector').val();

        

        console.log('Loading rounds for league:', leagueId, 'season:', currentSeason);

        

        this.fetchAPI('fixtures/rounds', { league: leagueId, season: currentSeason })

          .then(rounds => {

            console.log('Rounds response:', rounds);

            

            if (!rounds.length) {

              $('#rounds-list').html('<p>هفته‌ها در دسترس نیستند.</p>');

              return;

            }

            

            let roundsHtml = '';

            rounds.forEach(round => {

              // Handle both string and object formats

              const roundName = typeof round === 'string' ? round : round.name || 'نامشخص';

              const isCurrent = round.current ? 'current' : '';

              

              roundsHtml += `

                <div class="round-item ${isCurrent}" data-round="${roundName}">

                  <div class="round-name">${roundName}</div>

                </div>

              `;

            });

            

            $('#rounds-list').html(roundsHtml);

          })

          .catch(error => {

            console.error('Error loading rounds:', error);

            $('#rounds-list').html('<p>خطا در بارگذاری هفته‌ها</p>');

          });

      },



      loadLeagueStats: function(leagueId, season) {

        const currentSeason = season || $('#season-selector').val();

        

        console.log('Loading stats for league:', leagueId, 'season:', currentSeason);

        

        // Load top scorers

        this.fetchAPI('players/topscorers', { league: leagueId, season: currentSeason })

          .then(scorers => {

            console.log('Top scorers response:', scorers);

            

            if (scorers && scorers.length > 0) {

              let scorersHtml = '';

              scorers.slice(0, 10).forEach(player => {

                const stats = player.statistics?.[0];

                if (stats) {

                  scorersHtml += `

                    <div class="player-stat-card">

                      <img src="${player.player?.photo || 'https://media.api-sports.io/football/players/default.png'}" 

                           alt="${player.player?.name || 'نامشخص'}" 

                           class="player-avatar"

                           onerror="this.src='https://media.api-sports.io/football/players/default.png'">

                      <div class="player-info">

                        <div class="player-name">${player.player?.name || 'نامشخص'}</div>

                        <div class="player-team">${stats.team?.name || 'نامشخص'}</div>

                      </div>

                      <div class="player-stats">${stats.goals?.total || 0} گل</div>

                    </div>

                  `;

                }

              });

              $('#top-scorers').html(scorersHtml || '<p>اطلاعات آقای گل در دسترس نیست</p>');

            } else {

              $('#top-scorers').html('<p>اطلاعات آقای گل در دسترس نیست</p>');

            }

          })

          .catch(error => {

            console.error('Error loading top scorers:', error);

            $('#top-scorers').html('<p>خطا در بارگذاری آقای گل</p>');

          });

        

        // Load top assists

        this.fetchAPI('players/topassists', { league: leagueId, season: currentSeason })

          .then(assists => {

            console.log('Top assists response:', assists);

            

            if (assists && assists.length > 0) {

              let assistsHtml = '';

              assists.slice(0, 10).forEach(player => {

                const stats = player.statistics?.[0];

                if (stats) {

                  assistsHtml += `

                    <div class="player-stat-card">

                      <img src="${player.player?.photo || 'https://media.api-sports.io/football/players/default.png'}" 

                           alt="${player.player?.name || 'نامشخص'}" 

                           class="player-avatar"

                           onerror="this.src='https://media.api-sports.io/football/players/default.png'">

                      <div class="player-info">

                        <div class="player-name">${player.player?.name || 'نامشخص'}</div>

                        <div class="player-team">${stats.team?.name || 'نامشخص'}</div>

                      </div>

                      <div class="player-stats">${stats.goals?.assists || 0} پاس</div>

                    </div>

                  `;

                }

              });

              $('#top-assists').html(assistsHtml || '<p>اطلاعات پاس‌گل در دسترس نیست</p>');

            } else {

              $('#top-assists').html('<p>اطلاعات پاس‌گل در دسترس نیست</p>');

            }

          })

          .catch(error => {

            console.error('Error loading top assists:', error);

            $('#top-assists').html('<p>خطا در بارگذاری پاس‌گل</p>');

          });

        

        // Load top cards

        this.fetchAPI('players/topcards', { league: leagueId, season: currentSeason })

          .then(cards => {

            console.log('Top cards response:', cards);

            

            if (cards && cards.length > 0) {

              let cardsHtml = '';

              cards.slice(0, 10).forEach(player => {

                const stats = player.statistics?.[0];

                if (stats) {

                  const yellowCards = stats.cards?.yellow || 0;

                  const redCards = stats.cards?.red || 0;

                  cardsHtml += `

                    <div class="player-stat-card">

                      <img src="${player.player?.photo || 'https://media.api-sports.io/football/players/default.png'}" 

                           alt="${player.player?.name || 'نامشخص'}" 

                           class="player-avatar"

                           onerror="this.src='https://media.api-sports.io/football/players/default.png'">

                      <div class="player-info">

                        <div class="player-name">${player.player?.name || 'نامشخص'}</div>

                        <div class="player-team">${stats.team?.name || 'نامشخص'}</div>

                      </div>

                      <div class="player-stats">

                        <span class="yellow-cards">${yellowCards}🟨</span>

                        <span class="red-cards">${redCards}🟥</span>

                      </div>

                    </div>

                  `;

                }

              });

              $('#top-cards').html(cardsHtml || '<p>اطلاعات کارت‌ها در دسترس نیست</p>');

            } else {

              $('#top-cards').html('<p>اطلاعات کارت‌ها در دسترس نیست</p>');

            }

          })

          .catch(error => {

            console.error('Error loading top cards:', error);

            $('#top-cards').html('<p>خطا در بارگذاری کارت‌ها</p>');

          });

      },



      bindLeagueModalEvents: function() {

        const app = this;

        

        // Close modal

        $('#close-league-modal, #league-details-modal').on('click', function(e) {

          if (e.target === this) {

            const modal = $('#league-details-modal');

            modal.css('display', 'none');

            modal.removeClass('show');

            console.log('✅ Modal closed');

          }

        });

        

        // Season selector change

        $('#season-selector').on('change', function() {

          const season = $(this).val();

          const leagueId = app.currentLeagueId;

          console.log('Season changed to:', season, 'for league:', leagueId);

          app.loadSeasonData(leagueId, season);

        });

        

        // Tab switching

        $('.tab-button').on('click', function() {

          const tabId = $(this).data('tab');

          console.log('Tab clicked:', tabId);

          

          // Update active tab

          $('.tab-button').removeClass('active');

          $(this).addClass('active');

          

          // Show active tab content

          $('.tab-panel').removeClass('active');

          $(`#${tabId}-tab`).addClass('active');

          
          // Reset scroll position for new tab
          const newTab = $(`#${tabId}-tab`);
          if (newTab.length) {
            newTab.scrollTop(0);
            // Update scroll indicators
            setTimeout(() => {
              app.updateScrollIndicators(newTab);
            }, 100);
          }
          

          // Load tab content if needed

          const leagueId = app.currentLeagueId;

          const season = $('#season-selector').val();

          

          console.log('Loading content for tab:', tabId, 'league:', leagueId, 'season:', season);

          

          if (leagueId && season) {

            switch(tabId) {

              case 'overview':
                

                console.log('Loading overview tab...');

                app.loadLeagueOverview(leagueId, season);

                break;

              case 'standings':

                console.log('Loading standings tab...');

                app.loadLeagueStandings(leagueId, season);

                break;

              case 'teams':

                console.log('Loading teams tab...');

                app.loadLeagueTeams(leagueId, season);

                break;

              case 'fixtures':

                console.log('Loading fixtures tab...');

                app.loadLeagueFixtures(leagueId, season);

                break;

              case 'rounds':

                console.log('Loading rounds tab...');

                app.loadLeagueRounds(leagueId, season);

                break;

              case 'stats':

                console.log('Loading stats tab...');

                app.loadLeagueStats(leagueId, season);

                break;

            }

          } else {

            console.error('Missing leagueId or season:', { leagueId, season });

          }

        });

        
        // Add scroll to bottom functionality for desktop
        this.addScrollToBottomFeature();
      },

      bindLeagueDetailsEvents: function() {
        const app = this;
        
        // Close league details section
        $('.close-league-details').on('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          $('#league-details-section').hide();
          $('.match-details-sidebar').show(); // Show match details again
          console.log('✅ League details section closed');
        });
        
        // Season selector change
        $('#sidebar-season-selector').on('change', function() {
          const season = $(this).val();
          const leagueId = app.currentLeagueId;
          console.log('Season changed to:', season, 'for league:', leagueId);
          app.loadSeasonData(leagueId, season);
        });
        
        // Tab switching for league details
        $('.league-nav-tabs .tab-list a').on('click', function(e) {
          e.preventDefault();
          const tabId = $(this).attr('href').substring(1); // Remove # from href
          console.log('League tab clicked:', tabId);
          
          // Update active tab
          $('.league-nav-tabs .tab-list li').removeClass('active');
          $(this).parent().addClass('active');
          
          // Show active tab content
          $('.league-details-section .tab-content').removeClass('active');
          $(`#${tabId}`).addClass('active');
          
          // Load tab content if needed
          const leagueId = app.currentLeagueId;
          const season = $('#sidebar-season-selector').val();
          
          console.log('Loading content for tab:', tabId, 'league:', leagueId, 'season:', season);
          
          if (leagueId && season) {
            switch(tabId) {
              case 'league-overview':
                console.log('Loading overview tab...');
                app.loadLeagueOverview(leagueId);
                break;
              case 'league-standings':
                console.log('Loading standings tab...');
                app.loadLeagueStandings(leagueId);
                break;
              case 'league-teams':
                console.log('Loading teams tab...');
                app.loadLeagueTeams(leagueId);
                break;
              case 'league-fixtures':
                console.log('Loading fixtures tab...');
                app.loadLeagueFixtures(leagueId);
                break;
              case 'league-stats':
                console.log('Loading stats tab...');
                app.loadLeagueStats(leagueId);
                break;
            }
          } else {
            console.error('Missing leagueId or season:', { leagueId, season });
            // Load without season for overview
            if (tabId === 'league-overview') {
              app.loadLeagueOverview(leagueId);
            }
          }
        });
      },

      

      setActiveTab: function(tabId) {

        console.log('🔄 Setting active tab:', tabId);

        

        // Check if tab button exists

        const tabButton = $(`.tab-button[data-tab="${tabId}"]`);

        console.log('🔍 Tab button found:', tabButton.length ? 'Yes' : 'No');

        

        // Update active tab button

        $('.tab-button').removeClass('active');

        tabButton.addClass('active');

        console.log('✅ Tab button activated:', tabId);

        

        // Check if tab panel exists

        const tabPanel = $(`#${tabId}-tab`);

        console.log('🔍 Tab panel found:', tabPanel.length ? 'Yes' : 'No');

        

        // Show active tab content

        $('.tab-panel').removeClass('active');

        tabPanel.addClass('active');

        console.log('✅ Tab panel activated:', tabId);

        

        // Verify the tab is visible

        const isVisible = tabPanel.hasClass('active');

        console.log('🔍 Tab visibility check:', isVisible);

        

        // Check CSS display property

        const display = tabPanel.css('display');

        console.log('🔍 CSS display property:', display);

        

        // Check if the tab is actually visible

        const computedDisplay = tabPanel.css('display');

        console.log('🔍 Computed display property:', computedDisplay);

        

        // Force display if needed

        if (computedDisplay === 'none') {

          console.log('⚠️ Tab is hidden, forcing display...');

          tabPanel.css('display', 'block');

        }

        

        // Additional debugging for the specific content element

        if (tabId === 'overview') {

          const seasonDetails = $('#season-details');

          console.log('🔍 Season details element found:', seasonDetails.length ? 'Yes' : 'No');

          if (seasonDetails.length) {

            console.log('🔍 Season details parent tab:', seasonDetails.closest('.tab-panel').attr('id'));

            console.log('🔍 Season details parent has active class:', seasonDetails.closest('.tab-panel').hasClass('active'));

            console.log('🔍 Season details computed display:', seasonDetails.css('display'));

            console.log('🔍 Season details computed visibility:', seasonDetails.css('visibility'));

            console.log('🔍 Season details computed opacity:', seasonDetails.css('opacity'));

            console.log('🔍 Season details computed height:', seasonDetails.css('height'));

            console.log('🔍 Season details computed width:', seasonDetails.css('width'));

            console.log('🔍 Season details computed position:', seasonDetails.css('position'));

            console.log('🔍 Season details computed z-index:', seasonDetails.css('z-index'));

            

            // Check if parent elements are visible

            const parentTab = seasonDetails.closest('.tab-panel');

            const tabContent = parentTab.closest('.tab-content');

            const modalBody = tabContent.closest('.league-modal-body');

            const modal = modalBody.closest('#league-details-modal');

            

            console.log('🔍 Parent tab visible:', parentTab.is(':visible'));

            console.log('🔍 Tab content visible:', tabContent.is(':visible'));

            console.log('🔍 Modal body visible:', modalBody.is(':visible'));

            console.log('🔍 Modal visible:', modal.is(':visible'));

            

            // Force all parent elements to be visible

            if (!parentTab.is(':visible')) {

              console.log('⚠️ Parent tab not visible, forcing...');

              parentTab.css('display', 'block');

            }

            if (!tabContent.is(':visible')) {

              console.log('⚠️ Tab content not visible, forcing...');

              tabContent.css('display', 'block');

            }

          }

        }

        

        console.log('✅ Tab activated successfully:', tabId);

      },



      bindLeagueClickEvents: function() {

        const app = this;

        

        // Remove existing event handlers to prevent duplicates

        $(document).off('click', '.league-item');

        $(document).off('click', '.favorite-btn');

        

        // Bind click events to all league items

        $(document).on('click', '.league-item', function(e) {
          e.preventDefault();
          e.stopPropagation();

          const leagueId = $(this).data('league-id');
          console.log('League item clicked:', leagueId);

          // Use the new simple function
          app.showLeagueInSidebar(leagueId);
        });

        
        // Bind click events to favorite buttons
        $(document).on('click', '.favorite-btn', function(e) {
          e.preventDefault();
          e.stopPropagation();
          const leagueId = $(this).data('league-id');
          console.log('Favorite button clicked for league:', leagueId);
          app.toggleLeagueFavorite(leagueId);
        });

      },


            // Add scroll to bottom functionality for desktop league modal
      addScrollToBottomFeature: function() {
        const app = this;
        
        // Only add scroll to bottom for desktop (non-mobile)
        if (window.innerWidth <= 768) return;
        
        // Add custom easing function if not available
        if (!$.easing || !$.easing.easeInOutQuart) {
          $.easing = $.easing || {};
          $.easing.easeInOutQuart = function(x, t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
            return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
          };
        }
        
        // Create scroll to bottom button
        const scrollButton = $(`
          <div id="scroll-to-bottom-btn" class="scroll-to-bottom-btn" title="اسکرول به پایین">
            <i class="fa fa-chevron-down"></i>
          </div>
        `);
        
        // Add button to modal
        $('#league-details-modal').append(scrollButton);
        
        // Show/hide button based on scroll position
        $('.tab-content').on('scroll', function() {
          const scrollTop = $(this).scrollTop();
          const scrollHeight = $(this)[0].scrollHeight;
          const clientHeight = $(this)[0].clientHeight;
          
          // Show button when scrolled down, hide when at top
          if (scrollTop > 100) {
            scrollButton.addClass('visible');
          } else {
            scrollButton.removeClass('visible');
          }
          
          // Hide button when at bottom
          if (scrollTop + clientHeight >= scrollHeight - 10) {
            scrollButton.removeClass('visible');
          }
          
          // Add scroll direction indicator
          if (scrollTop > 200) {
            scrollButton.addClass('scrolled-far');
          } else {
            scrollButton.removeClass('scrolled-far');
          }
        });
        
        // Also monitor individual tab panels for scroll
        $('.tab-panel').on('scroll', function() {
          const scrollTop = this.scrollTop;
          const scrollHeight = this.scrollHeight;
          const clientHeight = this.clientHeight;
          
          // Show button when content is scrollable and scrolled down
          if (scrollHeight > clientHeight && scrollTop > 100) {
            scrollButton.addClass('visible');
          } else if (scrollTop <= 100) {
            scrollButton.removeClass('visible');
          }
          
          // Hide button when at bottom
          if (scrollTop + clientHeight >= scrollHeight - 10) {
            scrollButton.removeClass('visible');
          }
        });
        
        // Scroll to bottom functionality
        scrollButton.on('click', function() {
          const activeTab = $('.tab-panel.active');
          if (activeTab.length) {
            const scrollContainer = activeTab.closest('.tab-content');
            
            // Add loading state to button
            scrollButton.addClass('scrolling');
            scrollButton.find('i').removeClass('fa-chevron-down').addClass('fa-spinner fa-spin');
            
            scrollContainer.animate({
              scrollTop: scrollContainer[0].scrollHeight
            }, 800, 'easeInOutQuart', function() {
              // Reset button state after animation
              setTimeout(() => {
                scrollButton.removeClass('scrolling');
                scrollButton.find('i').removeClass('fa-spinner fa-spin').addClass('fa-chevron-down');
              }, 200);
            });
          }
        });
        
        // Add keyboard shortcut (Ctrl/Cmd + End)
        $(document).on('keydown', function(e) {
          if ((e.ctrlKey || e.metaKey) && e.keyCode === 35) { // End key
            e.preventDefault();
            const activeTab = $('.tab-panel.active');
            if (activeTab.length) {
              const scrollContainer = activeTab.closest('.tab-content');
              scrollContainer.animate({
                scrollTop: scrollContainer[0].scrollHeight
              }, 800, 'easeInOutQuart');
            }
          }
        });
        
        // Add smooth scroll behavior for better UX
        this.addSmoothScrollBehavior();
        
        console.log('✅ Scroll to bottom feature added for desktop');
      },

      // Add smooth scroll behavior for better user experience
      addSmoothScrollBehavior: function() {
        // Add smooth scrolling to all tab panels
        $('.tab-panel').css('scroll-behavior', 'smooth');
        
        // Add scroll indicators for better UX
        this.addScrollIndicators();
        
        // Add scroll progress indicator
        this.addScrollProgressIndicator();
      },

      // Add scroll indicators to show scroll position
      addScrollIndicators: function() {
        $('.tab-panel').each(function() {
          const panel = $(this);
          const panelId = panel.attr('id');
          
          // Add scroll indicator container
          if (!panel.find('.scroll-indicator-container').length) {
            panel.prepend(`
              <div class="scroll-indicator-container">
                <div class="scroll-progress-bar">
                  <div class="scroll-progress-fill"></div>
                </div>
                <div class="scroll-position-indicator">
                  <span class="scroll-percentage">0%</span>
                </div>
              </div>
            `);
          }
          
          // Update scroll indicators on scroll
          panel.on('scroll', function() {
            const scrollTop = this.scrollTop;
            const scrollHeight = this.scrollHeight;
            const clientHeight = this.clientHeight;
            
            if (scrollHeight > clientHeight) {
              const scrollPercentage = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
              
              // Update progress bar
              panel.find('.scroll-progress-fill').css('width', scrollPercentage + '%');
              
              // Update percentage text
              panel.find('.scroll-percentage').text(scrollPercentage + '%');
              
              // Show/hide indicators based on scroll position
              if (scrollTop > 50) {
                panel.find('.scroll-indicator-container').addClass('visible');
              } else {
                panel.find('.scroll-indicator-container').removeClass('visible');
              }
            }
          });
        });
      },

            // Add scroll progress indicator
      addScrollProgressIndicator: function() {
        // Add CSS for scroll indicators
        if (!$('#scroll-indicators-style').length) {
          $('head').append(`
            <style id="scroll-indicators-style">
              .scroll-indicator-container {
                position: sticky;
                top: 0;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                padding: 10px 0;
                margin: -20px -20px 20px -20px;
                border-bottom: 1px solid #eee;
                z-index: 10;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
              }
              
              .scroll-indicator-container.visible {
                opacity: 1;
                transform: translateY(0);
              }
              
              .scroll-progress-bar {
                width: 100%;
                height: 4px;
                background: #f0f0f0;
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 8px;
              }
              
              .scroll-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--primary-color), #1a6bb8);
                border-radius: 2px;
                transition: width 0.3s ease;
                width: 0%;
              }
              
              .scroll-position-indicator {
                text-align: center;
                font-size: 12px;
                color: var(--text-secondary);
                font-weight: 500;
              }
              
              .scroll-percentage {
                background: var(--primary-color);
                color: white;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 11px;
              }
            </style>
          `);
        }
      },

      // Update scroll indicators for a specific tab
      updateScrollIndicators: function(tabPanel) {
        if (!tabPanel || !tabPanel.length) return;
        
        const scrollTop = tabPanel.scrollTop();
        const scrollHeight = tabPanel[0].scrollHeight;
        const clientHeight = tabPanel[0].clientHeight;
        
        if (scrollHeight > clientHeight) {
          const scrollPercentage = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
          
          // Update progress bar
          tabPanel.find('.scroll-progress-fill').css('width', scrollPercentage + '%');
          
          // Update percentage text
          tabPanel.find('.scroll-percentage').text(scrollPercentage + '%');
          
          // Show/hide indicators based on scroll position
          if (scrollTop > 50) {
            tabPanel.find('.scroll-indicator-container').addClass('visible');
          } else {
            tabPanel.find('.scroll-indicator-container').removeClass('visible');
          }
        }
      },


      // Display substitutes list

      displaySubstitutes: function(teamType, substitutes) {

        const substitutesContainer = $(`.${teamType}-lineup .lineup-players`);

        

        if (!substitutes || substitutes.length === 0) {

          substitutesContainer.html('<div class="no-lineup">بازیکن ذخیره‌ای وجود ندارد</div>');

          return;

        }

        

        let substitutesHtml = '<h6>بازیکنان ذخیره:</h6>';

        

        substitutes.forEach(substitute => {

          substitutesHtml += `

            <div class="substitute-player">

              <div class="player-avatar">${substitute.player.number || '?'}</div>

              <div class="player-details">

                <div class="player-name">${substitute.player.name}</div>

                <div class="player-position">${this.getPositionText(substitute.pos || 'unknown')}</div>

              </div>

            </div>

          `;

        });

        

        substitutesContainer.html(substitutesHtml);

      },



      // Handle responsive behavior

      handleResponsiveBehavior: function() {

        const isMobile = window.innerWidth <= 1024;

        

        // Sidebar is always visible, no need to show/hide
        // if (isMobile) {

        //   // On mobile/tablet, hide sidebar by default

        //   $('.match-details-sidebar').hide();

        // } else {

        //   // On desktop, show sidebar by default

        //   $('.match-details-sidebar').show();

        // }

      },



      // Initialize responsive behavior

      initResponsive: function() {

        // Handle initial responsive state

        this.handleResponsiveBehavior();

        

        // Handle window resize

        $(window).on('resize', () => {

          this.handleResponsiveBehavior();

        });

      },



      // Search functionality

      searchMatches: function(container, searchTerm) {

        if (!searchTerm || searchTerm.trim() === '') {

          // If search is empty, reload all matches

          this.loadMatches(container, this.state.currentDate, this.state.filters);

          return;

        }



        const searchLower = searchTerm.toLowerCase().trim();

        console.log('🔍 Searching for:', searchTerm);



        // Show loading

        this.showLoading(container, true);

        container.find('#match_list').empty();

        container.find('.no-results').addClass('hidden');



        // Get current filters

        const params = {

          date: this.state.currentDate,

          timezone: this.config.api.timezone

        };

        

        if (this.state.filters.country) params.country = this.state.filters.country;



        // Fetch matches and then filter them

        this.fetchAPI('fixtures', params, false)

          .then(fixtures => {

            if (!fixtures.length) {

              container.find('.no-results .text').text('هیچ مسابقه‌ای یافت نشد.');

              container.find('.no-results').removeClass('hidden');

              return;

            }



            // Filter matches based on search term

            const filteredFixtures = fixtures.filter(fixture => {

              const homeTeam = fixture.teams.home.name.toLowerCase();

              const awayTeam = fixture.teams.away.name.toLowerCase();

              const leagueName = fixture.league.name.toLowerCase();

              const countryName = fixture.league.country.toLowerCase();

              

              return homeTeam.includes(searchLower) || 

                     awayTeam.includes(searchLower) || 

                     leagueName.includes(searchLower) || 

                     countryName.includes(searchLower);

            });



            if (!filteredFixtures.length) {

              container.find('.no-results .text').text(`هیچ مسابقه‌ای برای "${searchTerm}" یافت نشد.`);

              container.find('.no-results').removeClass('hidden');

              return;

            }



            // Group and display filtered matches

            const grouped = this.groupBy(filteredFixtures, f => f.league.id);

            Object.entries(grouped).forEach(([leagueId, leagueFixtures]) => {

              const league = leagueFixtures[0].league;

              const countryClass = league.country.toLowerCase().replace(/ /g, '-');

              const headerHtml = `

                <div class="header-row">

                  <div class="flags f32 f24 ${countryClass}"></div>

                  <div class="tournament-name">

                    <small>${league.country}</small>

                    <strong><a href="#">${league.name}</a></strong>

                    <i class="fa fa-angle-double-left"></i>

                    <a href="#">جدول رده‌بندی</a>

                  </div>

                </div>

              `;

              

              const matchesHtml = leagueFixtures.map(f => this.renderMatchRowEnhanced(f)).join('');

              container.find('#match_list').append(`<div class="box-shadow" data-stage-id="${leagueId}">${headerHtml}${matchesHtml}</div>`);

            });



            // Show search results count

            const totalMatches = filteredFixtures.length;

            container.find('.notifications-box .selector').html(`

              <div class="search-results-info">

                <i class="fa fa-search"></i>

                <span>نتایج جستجو: ${totalMatches} مسابقه برای "${searchTerm}"</span>

                <button class="clear-search" onclick="window.Football11App.clearSearch(this)">

                  <i class="fa fa-times"></i> پاک کردن جستجو

                </button>

              </div>

            `);

          })

          .catch(error => {

            console.error('Search error:', error);

            container.find('.no-results .text').text('خطا در جستجو. لطفاً دوباره تلاش کنید.');

            container.find('.no-results').removeClass('hidden');

          })

          .finally(() => {

            this.showLoading(container, false);

          });

      },



      // Clear search and reload all matches

      clearSearch: function(button) {

        const container = $(button).closest('.football11-app');

        const searchInput = container.find('.search-box-container input');

        

        // Clear search input

        searchInput.val('');

        

        // Clear search results info

        container.find('.notifications-box .selector').empty();

        

        // Reload all matches

        this.loadMatches(container, this.state.currentDate, this.state.filters);

      },



      // Main filter functionality (Sofascore style)

      initMainFilters: function(container) {

        const app = this;

        console.log('🔧 Initializing main filters...');

        

        // Handle main filter tab clicks

        container.find('.filter-tab').on('click', function() {

          const filterType = $(this).data('filter');

          console.log('🔧 Filter tab clicked:', filterType);

          

          // Update active tab

          container.find('.filter-tab').removeClass('active');

          $(this).addClass('active');

          

          // Update state

          app.state.filters.mainFilter = filterType;

          

          // Load matches based on filter

          app.loadMatchesWithFilter(container, filterType);

        });

        

        console.log('🔧 Main filters initialized successfully');

      },



      // Load matches with main filter

      loadMatchesWithFilter: function(container, filterType) {

        this.showLoading(container, true);

        container.find('#match_list').empty();

        container.find('.no-results').addClass('hidden');

        

        const params = {

          date: this.state.currentDate,

          timezone: this.config.api.timezone

        };

        

        if (this.state.filters.country) params.country = this.state.filters.country;



        this.fetchAPI('fixtures', params, false)

          .then(fixtures => {

            if (!fixtures.length) {

              container.find('.no-results .text').text('هیچ مسابقه‌ای یافت نشد.');

              container.find('.no-results').removeClass('hidden');

              return;

            }



            // Filter matches based on main filter type

            let filteredFixtures = fixtures;

            switch(filterType) {

              case 'live':

                filteredFixtures = fixtures.filter(f => f.fixture.status.short === 'LIVE' || 

                                                      f.fixture.status.short === 'HT' || 

                                                      f.fixture.status.short === '2H');

                break;

              case 'finished':

                filteredFixtures = fixtures.filter(f => f.fixture.status.short === 'FT' || 

                                                      f.fixture.status.short === 'AET' || 

                                                      f.fixture.status.short === 'PEN');

                break;

              case 'upcoming':

                filteredFixtures = fixtures.filter(f => f.fixture.status.short === 'NS' || 

                                                      f.fixture.status.short === 'TBD');

                break;

              case 'all':

              default:

                // Show all matches

                break;

                        }
            
            // Apply favorites filter if active
            if (this.state.filters.favorite) {
              filteredFixtures = filteredFixtures.filter(f => this.isLeagueFavorite(f.league.id));
              console.log('🔧 Applied favorites filter, remaining fixtures:', filteredFixtures.length);
            }

            if (!filteredFixtures.length) {

              let message = 'هیچ مسابقه‌ای یافت نشد.';

              switch(filterType) {

                case 'live': message = 'هیچ مسابقه زنده‌ای یافت نشد.'; break;

                case 'finished': message = 'هیچ مسابقه تموم شده‌ای یافت نشد.'; break;

                case 'upcoming': message = 'هیچ مسابقه شروع نشده‌ای یافت نشد.'; break;

              }

              container.find('.no-results .text').text(message);

              container.find('.no-results').removeClass('hidden');

              return;

            }



            // Update live count

            const liveCount = fixtures.filter(f => f.fixture.status.short === 'LIVE' || 

                                                  f.fixture.status.short === 'HT' || 

                                                  f.fixture.status.short === '2H').length;

            container.find('#live-count').text(liveCount);



            // Group and display filtered matches

            this.displayMatchesByLeague(container, filteredFixtures);

          })

          .catch(error => {

            console.error('Filter error:', error);

            container.find('.no-results .text').text('خطا در بارگذاری مسابقات. لطفاً دوباره تلاش کنید.');

            container.find('.no-results').removeClass('hidden');

          })

          .finally(() => {

            this.showLoading(container, false);

          });

      },



      // Display matches grouped by league with limited display and show more option
      displayMatchesByLeague: function(container, fixtures) {

        const grouped = this.groupBy(fixtures, f => f.league.id);

        // Sort leagues by priority (Iran first, then favorites, then others)
        const sortedLeagues = Object.entries(grouped).sort(([, a], [, b]) => {
          const aLeague = a[0].league;
          const bLeague = b[0].league;
          const aIsIran = aLeague.country === 'Iran';
          const bIsIran = bLeague.country === 'Iran';
          const aIsFavorite = this.isLeagueFavorite(aLeague.id);
          const bIsFavorite = this.isLeagueFavorite(bLeague.id);
          
          // Iran leagues first
          if (aIsIran && !bIsIran) return -1;
          if (!aIsIran && bIsIran) return 1;
          
          // Then favorites
          if (aIsFavorite && !bIsFavorite) return -1;
          if (!aIsFavorite && bIsFavorite) return 1;
          
          // Then by country name
          return aLeague.country.localeCompare(bLeague.country);
        });

        sortedLeagues.forEach(([leagueId, leagueFixtures]) => {

          const league = leagueFixtures[0].league;

          const countryClass = league.country.toLowerCase().replace(/ /g, '-');

          const totalMatches = leagueFixtures.length;
          const initialDisplayCount = 5;
          const hasMoreMatches = totalMatches > initialDisplayCount;
          

          const headerHtml = `

            <div class="header-row">

              <div class="league-info">

                <div class="league-logo">
                  <img src="${league.logo || 'https://media.api-sports.io/football/leagues/default.png'}" alt="${league.name}" class="logo-img">
                </div>

                <div class="league-details">

                  <div class="league-country">${league.country}</div>

                  <div class="league-name">${league.name}</div>

                  <div class="league-round">${league.round || ''}</div>
                </div>

              </div>

              <div class="league-actions">
                <button class="favorite-btn ${this.isLeagueFavorite(leagueId) ? 'active' : ''}" data-league-id="${leagueId}" title="${this.isLeagueFavorite(leagueId) ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}">
                  <i class="fa fa-heart${this.isLeagueFavorite(leagueId) ? '' : '-o'}"></i>
                </button>
                <button class="pin-btn" data-league-id="${leagueId}" title="پین کردن لیگ">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 9V4L22 10L16 16V11H8V16L2 10L8 4V9H16Z" fill="currentColor"/>
                  </svg>
                </button>
                <a href="#" class="league-link" data-league-id="${leagueId}">
                  <i class="fa fa-table"></i>
                  <span>جدول</span>
                </a>
                <a href="#" class="league-link" data-league-id="${leagueId}">
                  <i class="fa fa-calendar"></i>
                  <span>برنامه</span>
                </a>
              </div>
            </div>

          `;

          

          // Show only first 5 matches initially
          const initialMatches = leagueFixtures.slice(0, initialDisplayCount);
          const matchesHtml = initialMatches.map(f => this.renderMatchRowEnhanced(f)).join('');
          
          // Add show more button if there are more matches
          const showMoreHtml = hasMoreMatches ? `
            <div class="show-more-container">
              <button class="show-more-btn" data-league-id="${leagueId}" data-total="${totalMatches}" data-shown="${initialDisplayCount}">
                <i class="fa fa-chevron-down"></i>
                نمایش بیشتر (${totalMatches - initialDisplayCount} مسابقه دیگر)
              </button>
            </div>
          ` : '';
          
          const leagueSection = $(`
            <div class="box-shadow league-section" data-league-id="${leagueId}">
              ${headerHtml}
              <div class="matches-container">
                ${matchesHtml}
              </div>
              ${showMoreHtml}
            </div>
          `);
          
          container.find('#match_list').append(leagueSection);
        });
        
        // Bind show more events
        this.bindShowMoreEvents();
      },

      // Bind show more button events
      bindShowMoreEvents: function() {
        const app = this;
        
        $(document).off('click', '.show-more-btn').on('click', '.show-more-btn', function(e) {
          e.preventDefault();
          const button = $(this);
          const leagueSection = button.closest('.league-section');
          const leagueId = button.data('league-id');
          const totalMatches = button.data('total');
          const currentlyShown = button.data('shown');
          
          // Get all fixtures for this league from cache or reload
          const allFixtures = app.getLeagueFixtures(leagueId);
          if (!allFixtures || allFixtures.length <= currentlyShown) {
            console.log('No more matches to show for league:', leagueId);
            return;
          }
          
          // Show all remaining matches
          const remainingFixtures = allFixtures.slice(currentlyShown);
          const matchesHtml = remainingFixtures.map(f => app.renderMatchRowEnhanced(f)).join('');
          
          // Insert matches before the show more button
          button.before(matchesHtml);
          
          // Update button to show "show less" option
          button.html(`
            <i class="fa fa-chevron-up"></i>
            نمایش کمتر
          `).removeClass('show-more-btn').addClass('show-less-btn');
          
          // Update data attributes
          button.data('shown', totalMatches);
          
          // Add smooth scroll to newly added matches
          leagueSection.find('.match-row').slice(-remainingFixtures.length).hide().each(function(index) {
            $(this).delay(index * 100).fadeIn(300);
          });
          
          console.log(`✅ Showed ${remainingFixtures.length} more matches for league ${leagueId}`);
        });
        
        // Bind show less events
        $(document).off('click', '.show-less-btn').on('click', '.show-less-btn', function(e) {
          e.preventDefault();
          const button = $(this);
          const leagueSection = button.closest('.league-section');
          const leagueId = button.data('league-id');
          
          // Hide all matches except first 5
          const allMatches = leagueSection.find('.match-row');
          if (allMatches.length > 5) {
            allMatches.slice(5).fadeOut(300, function() {
              $(this).remove();
            });
          }
          
          // Reset button to show more
          button.html(`
            <i class="fa fa-chevron-down"></i>
            نمایش بیشتر
          `).removeClass('show-less-btn').addClass('show-more-btn');
          
          // Reset data attributes
          button.data('shown', 5);
          
          console.log(`✅ Hidden extra matches for league ${leagueId}`);
        });
      },

      // Get league fixtures from cache or current state
      getLeagueFixtures: function(leagueId) {
        // Check if we have cached fixtures for this league
        if (this.cachedLeagueFixtures && this.cachedLeagueFixtures[leagueId]) {
          return this.cachedLeagueFixtures[leagueId];
        }
        
        console.log('❌ No cached fixtures found for league:', leagueId);
        return null;
      },

      // Ensure close button works properly on mobile
      ensureCloseButtonWorks: function() {
        const app = this;
        
        // Remove any existing handlers to prevent duplicates
        $(document).off('click', '.close-details');
        
        // Close button is disabled since details are always visible
        // // Add new handler with event delegation
        // $(document).on('click', '.close-details', function(e) {
        //   e.preventDefault();
        //   e.stopPropagation();
        //   console.log('Close details button clicked from ensureCloseButtonWorks');
          
        //   // Hide sidebar
        //   $('.match-details-sidebar').hide().removeClass('active');
          
        //   // Add mobile-specific handling
        //   if (window.innerWidth <= 768) {
        //     $('body').removeClass('sidebar-open');
        //     $('.livescore-container').removeClass('sidebar-open');
        //   }
        // });
        
        // // Also handle touch events for mobile
        // $(document).off('touchstart', '.close-details');
        // $(document).on('touchstart', '.close-details', function(e) {
        //   e.preventDefault();
        //   e.stopPropagation();
        //   console.log('Close details button touched on mobile');
          
        //   $('.match-details-sidebar').hide().removeClass('active');
          
        //   if (window.innerWidth <= 768) {
        //     $('body').removeClass('sidebar-open');
        //     $('.livescore-container').removeClass('sidebar-open');
        //   }
        // });
      },

      // Simple function to show league modal (for testing)
      showLeagueModal: function() {
        console.log('🎯 showLeagueModal called');
        
        // Try to get the first available league ID from the top leagues
        const firstLeague = $('.league-item').first();
        if (firstLeague.length) {
          const leagueId = firstLeague.data('league-id');
          console.log('✅ Found league ID:', leagueId);
          this.showLeagueDetails(leagueId);
        } else {
          console.log('❌ No league items found, showing empty modal');
          // Show modal without content for testing
          $('#league-details-modal').show();
          this.bindLeagueModalEvents();
        }
      },

      // Enhanced search functionality with better UX
      searchMatchesEnhanced: function(container, searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
          // If search is empty, reload all matches
          this.loadMatches(container, this.state.currentDate, this.state.filters);
          return;
        }

        const searchLower = searchTerm.toLowerCase().trim();
        console.log('🔍 Enhanced search for:', searchTerm);

        // Show enhanced loading state
        this.showEnhancedLoading(container, 'جستجو در حال انجام...');

        // Get current filters
        const params = {
          date: this.state.currentDate,
          timezone: this.config.api.timezone
        };
        
        if (this.state.filters.country) params.country = this.state.filters.country;

        // Fetch matches and then filter them
        this.fetchAPI('fixtures', params, false)
          .then(fixtures => {
            if (!fixtures.length) {
              this.showEnhancedError(container, 'هیچ مسابقه‌ای یافت نشد.', 'جستجو نتیجه‌ای نداشت');
              return;
            }

            // Filter matches based on search term
            const filteredFixtures = fixtures.filter(fixture => {
              const homeTeam = fixture.teams.home.name.toLowerCase();
              const awayTeam = fixture.teams.away.name.toLowerCase();
              const leagueName = fixture.league.name.toLowerCase();
              const countryName = fixture.league.country.toLowerCase();
              
              return homeTeam.includes(searchLower) || 
                     awayTeam.includes(searchLower) || 
                     leagueName.includes(searchLower) || 
                     countryName.includes(searchLower);
            });

            if (!filteredFixtures.length) {
              this.showEnhancedError(container, `هیچ مسابقه‌ای برای "${searchTerm}" یافت نشد.`, 'جستجو نتیجه‌ای نداشت');
              return;
            }

            // Show enhanced search results
            this.displayEnhancedSearchResults(container, filteredFixtures, searchTerm);
          })
          .catch(error => {
            console.error('Enhanced search error:', error);
            this.showEnhancedError(container, 'خطا در جستجو. لطفاً دوباره تلاش کنید.', 'خطا در جستجو');
          })
          .finally(() => {
            this.hideEnhancedLoading(container);
          });
      },

      // Show enhanced loading state
      showEnhancedLoading: function(container, message = 'در حال بارگذاری...') {
        const loadingHtml = `
          <div class="loading-overlay active">
            <div class="loading-content">
              <div class="loading-spinner"></div>
              <div class="loading-text">${message}</div>
            </div>
          </div>
        `;
        
        // Remove existing loading
        container.find('.loading-overlay').remove();
        
        // Add new loading
        container.append(loadingHtml);
      },

      // Hide enhanced loading state
      hideEnhancedLoading: function(container) {
        container.find('.loading-overlay').removeClass('active');
        setTimeout(() => {
          container.find('.loading-overlay').remove();
        }, 300);
      },

      // Show enhanced error state
      showEnhancedError: function(container, message, title = 'خطا') {
        const errorHtml = `
          <div class="error-container fade-in">
            <div class="error-icon">⚠️</div>
            <div class="error-title">${title}</div>
            <div class="error-message">${message}</div>
            <button class="retry-button" onclick="window.Football11App.retryLastAction(this)">
              <i class="fa fa-refresh"></i> تلاش مجدد
            </button>
          </div>
        `;
        
        container.find('#match_list').html(errorHtml);
      },

      // Display enhanced search results
      displayEnhancedSearchResults: function(container, fixtures, searchTerm) {
        // Clear previous results
        container.find('#match_list').empty();
        
        // Add search results header
        const resultsHeader = `
          <div class="search-results-container slide-down">
            <div class="search-results-header">
              <div class="search-results-info">
                <i class="fa fa-search"></i>
                <span>نتایج جستجو برای "${searchTerm}"</span>
                <span class="search-results-count">${fixtures.length} مسابقه</span>
              </div>
              <button class="clear-search-button" onclick="window.Football11App.clearSearchEnhanced(this)">
                <i class="fa fa-times"></i> پاک کردن جستجو
              </button>
            </div>
          </div>
        `;
        
        container.find('#match_list').append(resultsHeader);
        
        // Group and display filtered matches with enhanced styling
        const grouped = this.groupBy(fixtures, f => f.league.id);
        const sortedLeagues = Object.entries(grouped).sort(([, a], [, b]) => {
          const aLeague = a[0].league;
          const bLeague = b[0].league;
          const aIsIran = aLeague.country === 'Iran';
          const bIsIran = bLeague.country === 'Iran';
          const aIsFavorite = this.isLeagueFavorite(aLeague.id);
          const bIsFavorite = this.isLeagueFavorite(bLeague.id);
          
          // Iran leagues first
          if (aIsIran && !bIsIran) return -1;
          if (!aIsIran && bIsIran) return 1;
          
          // Then favorites
          if (aIsFavorite && !bIsFavorite) return -1;
          if (!aIsFavorite && bIsFavorite) return 1;
          
          // Then by country name
          return aLeague.country.localeCompare(bLeague.country);
        });

        sortedLeagues.forEach(([leagueId, leagueFixtures], index) => {
          const league = leagueFixtures[0].league;
          const countryClass = league.country.toLowerCase().replace(/ /g, '-');
          
          const headerHtml = `
            <div class="league-header slide-down" style="animation-delay: ${index * 0.1}s">
              <div class="league-info">
                <div class="league-logo">
                  <img src="${league.logo || 'https://media.api-sports.io/football/leagues/default.png'}" 
                       alt="${league.name}" class="logo-img">
                </div>
                <div class="league-details">
                  <h3>${league.name}</h3>
                  <p>${league.country}</p>
                </div>
              </div>
            </div>
          `;
          
          const matchesHtml = leagueFixtures.map(f => this.renderMatchRowEnhanced(f)).join('');
          
          const leagueSection = $(`
            <div class="league-section fade-in" style="animation-delay: ${index * 0.1 + 0.2}s">
              ${headerHtml}
              <div class="matches-container">
                ${matchesHtml}
              </div>
            </div>
          `);
          
          container.find('#match_list').append(leagueSection);
        });
        
        // Add smooth scroll to top
        container.find('#match_list')[0].scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      },

      // Clear enhanced search
      clearSearchEnhanced: function(button) {
        const container = $(button).closest('.football11-app');
        const searchInput = container.find('.search-box-container input');
        
        // Clear search input
        searchInput.val('');
        
        // Clear search results
        container.find('.search-results-container').fadeOut(300, function() {
          $(this).remove();
        });
        
        // Reload all matches
        this.loadMatches(container, this.state.currentDate, this.state.filters);
      },

      // Retry last action
      retryLastAction: function(button) {
        const container = $(button).closest('.football11-app');
        const searchInput = container.find('.search-box-container input');
        const searchTerm = searchInput.val();
        
        if (searchTerm && searchTerm.trim()) {
          // Retry search
          this.searchMatchesEnhanced(container, searchTerm);
        } else {
          // Retry loading matches
          this.loadMatches(container, this.state.currentDate, this.state.filters);
        }
      },

      // Enhanced mobile experience functions
      initMobileExperience: function() {
        if (window.innerWidth <= 768) {
          this.setupMobileGestures();
          this.setupMobileNavigation();
          this.setupMobileSearch();
        }
      },

      // Setup mobile gestures
      setupMobileGestures: function() {
        let startX = 0;
        let startY = 0;
        
        // Swipe to close sidebar
        $('.match-details-sidebar').on('touchstart', function(e) {
          startX = e.originalEvent.touches[0].clientX;
          startY = e.originalEvent.touches[0].clientY;
        });
        
        $('.match-details-sidebar').on('touchmove', function(e) {
          if (!startX || !startY) return;
          
          const currentX = e.originalEvent.touches[0].clientX;
          const currentY = e.originalEvent.touches[0].clientY;
          const diffX = startX - currentX;
          const diffY = startY - currentY;
          
          // Horizontal swipe to close
          if (Math.abs(diffX) > Math.abs(diffY) && diffX > 50) {
            this.closeMatchDetails();
          }
        }.bind(this));
        
        // Pull to refresh
        let pullStart = 0;
        let pullDistance = 0;
        
        $('.livescore-container').on('touchstart', function(e) {
          if (this.scrollTop === 0) {
            pullStart = e.originalEvent.touches[0].clientY;
          }
        });
        
        $('.livescore-container').on('touchmove', function(e) {
          if (pullStart && this.scrollTop === 0) {
            pullDistance = e.originalEvent.touches[0].clientY - pullStart;
            if (pullDistance > 0) {
              this.style.transform = `translateY(${Math.min(pullDistance * 0.3, 100)}px)`;
            }
          }
        });
        
        $('.livescore-container').on('touchend', function(e) {
          if (pullDistance > 100) {
            // Trigger refresh
            this.style.transform = '';
            this.style.transition = 'transform 0.3s ease';
            setTimeout(() => {
              this.style.transition = '';
              window.Football11App.refreshData();
            }, 300);
          } else {
            this.style.transform = '';
          }
          pullStart = 0;
          pullDistance = 0;
        });
      },

      // Setup mobile navigation
      setupMobileNavigation: function() {
        // Add mobile menu button
        if (!$('.mobile-menu-btn').length) {
          $('.header').append(`
            <button class="mobile-menu-btn">
              <span></span>
              <span></span>
              <span></span>
            </button>
          `);
        }
        
        // Mobile menu functionality
        $('.mobile-menu-btn').on('click', function() {
          $('.top-tab-list').toggleClass('mobile-open');
          $(this).toggleClass('active');
        });
        
        // Close mobile menu when clicking outside
        $(document).on('click', function(e) {
          if (!$(e.target).closest('.mobile-menu-btn, .top-tab-list').length) {
            $('.top-tab-list').removeClass('mobile-open');
            $('.mobile-menu-btn').removeClass('active');
          }
        });
      },

      // Setup mobile search
      setupMobileSearch: function() {
        // Expand search on mobile
        $('.search-box-container input').on('focus', function() {
          if (window.innerWidth <= 768) {
            $(this).parent().addClass('mobile-expanded');
          }
        });
        
        $('.search-box-container input').on('blur', function() {
          if (window.innerWidth <= 768) {
            $(this).parent().removeClass('mobile-expanded');
          }
        });
      },

      // Refresh data function
      refreshData: function() {
        const container = $('.football11-app').first();
        if (container.length) {
          this.loadMatches(container, this.state.currentDate, this.state.filters);
        }
      },

      // Enhanced accessibility functions
      initAccessibility: function() {
        // Add ARIA labels
        this.addAriaLabels();
        
        // Add keyboard navigation
        this.addKeyboardNavigation();
        
        // Add focus management
        this.addFocusManagement();
      },

      // Add ARIA labels
      addAriaLabels: function() {
        // Search input
        $('.search-box-container input').attr({
          'aria-label': 'جستجو در مسابقات، تیم‌ها و لیگ‌ها',
          'aria-describedby': 'search-help'
        });
        
        // Add search help text
        if (!$('#search-help').length) {
          $('.search-box-container').append(`
            <div id="search-help" class="sr-only">
              برای جستجو، نام تیم، لیگ یا کشور را تایپ کنید
            </div>
          `);
        }
        
        // Match rows
        $('.match-row').each(function() {
          const $row = $(this);
          const homeTeam = $row.find('.home-team .team-name').text();
          const awayTeam = $row.find('.away-team .team-name').text();
          const score = $row.find('.score').text();
          
          $row.attr({
            'role': 'button',
            'tabindex': '0',
            'aria-label': `مسابقه ${homeTeam} مقابل ${awayTeam}، نتیجه: ${score}`,
            'aria-pressed': 'false'
          });
        });
        
        // Filter buttons
        $('.filter-item').each(function() {
          const $filter = $(this);
          const text = $filter.text();
          const isActive = $filter.hasClass('active');
          
          $filter.attr({
            'role': 'button',
            'aria-pressed': isActive.toString(),
            'aria-label': `فیلتر ${text}`
          });
        });
      },

      // Add keyboard navigation
      addKeyboardNavigation: function() {
        // Match row navigation
        $('.match-row').on('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $(this).click();
          }
        });
        
        // Filter navigation
        $('.filter-item').on('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $(this).click();
          }
        });
        
        // Search input navigation
        $('.search-box-container input').on('keydown', function(e) {
          if (e.key === 'Escape') {
            $(this).blur();
            window.Football11App.clearSearchEnhanced($(this).parent().find('.clear-search-button'));
          }
        });
      },

      // Add focus management
      addFocusManagement: function() {
        // Trap focus in sidebar on mobile
        $('.match-details-sidebar').on('keydown', function(e) {
          if (e.key === 'Tab') {
            const focusableElements = $(this).find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstElement = focusableElements.first();
            const lastElement = focusableElements.last();
            
            if (e.shiftKey && document.activeElement === firstElement[0]) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement[0]) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        });
        
        // Return focus when closing sidebar
        $('.close-details').on('click', function() {
          setTimeout(() => {
            $('.match-row:first').focus();
          }, 300);
        });
      },

      // Enhanced performance functions
      optimizePerformance: function() {
        // Debounce scroll events
        this.debounceScrollEvents();
        
        // Lazy load images
        this.lazyLoadImages();
        
        // Optimize animations
        this.optimizeAnimations();
      },

      // Debounce scroll events
      debounceScrollEvents: function() {
        let scrollTimeout;
        
        $('.livescore-container, .match-details-content').on('scroll', function() {
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            // Handle scroll events here
            window.Football11App.handleScrollOptimized($(this));
          }, 16); // ~60fps
        });
      },

      // Handle optimized scroll
      handleScrollOptimized: function(container) {
        // Add scroll-based animations
        const scrollTop = container.scrollTop();
        const containerHeight = container.height();
        
        // Fade out elements as they scroll up
        container.find('.match-row').each(function() {
          const $row = $(this);
          const rowTop = $row.offset().top;
          const rowHeight = $row.height();
          
          if (rowTop + rowHeight < scrollTop || rowTop > scrollTop + containerHeight) {
            $row.addClass('fade-out');
          } else {
            $row.removeClass('fade-out');
          }
        });
      },

      // Lazy load images
      lazyLoadImages: function() {
        if ('IntersectionObserver' in window) {
          const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
              }
            });
          });
          
          $('img[data-src]').each(function() {
            imageObserver.observe(this);
          });
        }
      },

      // Optimize animations
      optimizeAnimations: function() {
        // Use transform instead of top/left for better performance
        $('.match-row').css({
          'will-change': 'transform',
          'transform': 'translateZ(0)' // Force hardware acceleration
        });
        
        // Reduce repaints during animations
        $('.league-section').css({
          'will-change': 'opacity, transform'
        });
      },

    };



    $(document).ready(() => window.Football11App.init());



})(jQuery);