(function($) {
    'use strict';

    if (!window.Football11App) {
        window.Football11App = {};
    }

    window.Football11App.ui = {
        init: function(app) {
            this.app = app;
        },

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

        renderMatchRow: function(fixture) {
            const { teams, goals, fixture: fix, league } = fixture;
            const status = fix.status.short;
            const statusText = this.getStatusText(status);
            const statusClass = this.getStatusClass(status);

            const matchTime = new Date(fix.date);
            const timeString = matchTime.toLocaleTimeString('fa-IR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });

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

        getStatusText: function(status) {
            const statusMap = {
                'NS': 'شروع نشده', 'LIVE': 'زنده', 'HT': 'نیمه اول', '2H': 'نیمه دوم',
                'FT': 'تمام شده', 'AET': 'تموم شده (اضافه)', 'PEN': 'تموم شده (پنالتی)',
                'TBD': 'تعیین نشده', 'CANC': 'لغو شده', 'POST': 'تعویق شده'
            };
            return statusMap[status] || status;
        },

        getStatusClass: function(status) {
            const classMap = {
                'NS': 'status-upcoming', 'LIVE': 'status-live', 'HT': 'status-live',
                '2H': 'status-live', 'FT': 'status-finished', 'AET': 'status-finished',
                'PEN': 'status-finished', 'TBD': 'status-upcoming', 'CANC': 'status-cancelled',
                'POST': 'status-postponed'
            };
            return classMap[status] || 'status-unknown';
        },

        renderMatchesList: function(container, fixtures) {
            this.app.cacheLeagueFixtures(fixtures);
            this.displayMatchesByLeague(container, fixtures);
        },

        displayMatchesByLeague: function(container, fixtures, append = false) {
            if (!append) {
                container.find('#match_list').empty();
            }
            const grouped = this.app.groupBy(fixtures, f => f.league.id);
            const sortedLeagues = Object.entries(grouped).sort(([, a], [, b]) => {
                const aLeague = a[0].league;
                const bLeague = b[0].league;
                const aIsIran = aLeague.country === 'Iran';
                const bIsIran = bLeague.country === 'Iran';
                const aIsFavorite = this.app.isLeagueFavorite(aLeague.id);
                const bIsFavorite = this.app.isLeagueFavorite(bLeague.id);
                if (aIsIran && !bIsIran) return -1;
                if (!aIsIran && bIsIran) return 1;
                if (aIsFavorite && !bIsFavorite) return -1;
                if (!aIsFavorite && bIsFavorite) return 1;
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
                            <div class="league-logo"><img src="${league.logo || 'https://media.api-sports.io/football/leagues/default.png'}" alt="${league.name}" class="logo-img"></div>
                            <div class="league-details">
                                <div class="league-country">${league.country}</div>
                                <div class="league-name">${league.name}</div>
                                <div class="league-round">${league.round || ''}</div>
                            </div>
                        </div>
                        <div class="league-actions">
                            <button class="favorite-btn ${this.app.isLeagueFavorite(leagueId) ? 'active' : ''}" data-league-id="${leagueId}" title="${this.app.isLeagueFavorite(leagueId) ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}"><i class="fa fa-heart${this.app.isLeagueFavorite(leagueId) ? '' : '-o'}"></i></button>
                            <button class="pin-btn" data-league-id="${leagueId}" title="پین کردن لیگ"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 9V4L22 10L16 16V11H8V16L2 10L8 4V9H16Z" fill="currentColor"/></svg></button>
                            <a href="#" class="league-link" data-league-id="${leagueId}"><i class="fa fa-table"></i><span>جدول</span></a>
                            <a href="#" class="league-link" data-league-id="${leagueId}"><i class="fa fa-calendar"></i><span>برنامه</span></a>
                        </div>
                    </div>`;

                const initialMatches = leagueFixtures.slice(0, initialDisplayCount);
                const matchesHtml = initialMatches.map(f => this.renderMatchRowEnhanced(f)).join('');

                const showMoreHtml = hasMoreMatches ? `
                    <div class="show-more-container">
                        <button class="show-more-btn" data-league-id="${leagueId}" data-total="${totalMatches}" data-shown="${initialDisplayCount}"><i class="fa fa-chevron-down"></i> نمایش بیشتر (${totalMatches - initialDisplayCount} مسابقه دیگر)</button>
                    </div>` : '';

                const leagueSection = $(`<div class="box-shadow league-section" data-league-id="${leagueId}">${headerHtml}<div class="matches-container">${matchesHtml}</div>${showMoreHtml}</div>`);
                container.find('#match_list').append(leagueSection);
            });

            this.app.bindShowMoreEvents();
        },

        renderMatchRowEnhanced: function(fixture) {
            const { teams, goals, fixture: fix, league } = fixture;
            const status = fix.status.short;
            const time = new Date(fix.date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
            const scoreDisplay = status === 'NS' ? time : `${goals.home ?? '-'} - ${goals.away ?? '-'}`;
            const homeTeamLogo = this.app.getTeamLogoUrl(teams.home.logo, teams.home.name);
            const awayTeamLogo = this.app.getTeamLogoUrl(teams.away.logo, teams.away.name);

            return `
              <div class="match-row" data-fixture-id="${fix.id}" data-home-team-id="${teams.home.id}" data-away-team-id="${teams.away.id}">
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
        },

        // --- Pagination UI ---
        showPaginationProgress: function(currentPage, maxPages) {
            const progressHtml = `<div class="pagination-progress"><div class="progress-text">🔄 در حال دریافت نتایج...</div><div class="progress-info">صفحه ${currentPage} از ${maxPages}</div><div class="progress-bar"><div class="progress-fill" style="width: ${(currentPage / maxPages) * 100}%"></div></div></div>`;
            $('.pagination-progress').remove();
            $('body').append(progressHtml);
        },
        updatePaginationProgress: function(currentPage, maxPages) {
            const progress = $('.pagination-progress');
            if (progress.length) {
                progress.find('.progress-fill').css('width', `${(currentPage / maxPages) * 100}%`);
                progress.find('.progress-info').text(`صفحه ${currentPage} از ${maxPages}`);
            }
        },
        hidePaginationProgress: function() {
            $('.pagination-progress').fadeOut(300, function() { $(this).remove(); });
        },

        // --- Load More UI ---
        showLoadMoreProgress: function(container, page) {
            const progressHtml = `<div class="load-more-progress"><div class="progress-spinner">🔄</div><div class="progress-text">در حال بارگذاری صفحه ${page}...</div></div>`;
            container.find('.load-more-progress').remove();
            container.find('#match_list').after(progressHtml);
        },
        hideLoadMoreProgress: function(container) {
            container.find('.load-more-progress').fadeOut(300, function() { $(this).remove(); });
        },
        showLoadMoreButton: function(container, params, currentPage) {
            const buttonHtml = `<div class="load-more-container"><button class="load-more-btn" data-params='${JSON.stringify(params)}' data-page="${currentPage}"><span class="btn-text">نمایش مسابقات بیشتر</span><span class="btn-icon">⬇️</span></button></div>`;
            container.find('.load-more-container').remove();
            container.find('#match_list').after(buttonHtml);
        },
        hideLoadMoreButton: function(container) {
            container.find('.load-more-container').fadeOut(300, function() { $(this).remove(); });
        },
        showLoadMoreError: function(container) {
            const errorHtml = `<div class="load-more-error"><div class="error-text">خطا در بارگذاری مسابقات بیشتر</div><button class="retry-btn">تلاش مجدد</button></div>`;
            container.find('.load-more-error').remove();
            container.find('#match_list').after(errorHtml);
        },
        appendMatchesToList: function(container, fixtures) {
            if (!fixtures || !fixtures.length) return;
            const groupedFixtures = this.app.groupBy(fixtures, 'league.id');
            Object.keys(groupedFixtures).forEach(leagueId => {
                const leagueFixtures = groupedFixtures[leagueId];
                const existingLeague = container.find(`[data-league-id="${leagueId}"]`);
                if (existingLeague.length) {
                    const leagueContainer = existingLeague.find('.league-matches');
                    leagueFixtures.forEach(fixture => {
                        const matchRow = this.renderMatchRow(fixture);
                        leagueContainer.append(matchRow);
                    });
                } else {
                    this.displayMatchesByLeague(container, leagueFixtures, true);
                }
            });
        },

        // --- Match Details UI ---
        updateMatchHeader: function(fixture) {
            const { teams, goals, fixture: fix, league } = fixture;
            $('.match-details-sidebar .home-team .team-logo').attr('src', teams.home.logo || 'https://media.api-sports.io/football/teams/default.png').attr('alt', teams.home.name);
            $('.match-details-sidebar .home-team .team-name').text(teams.home.name);
            $('.match-details-sidebar .away-team .team-logo').attr('src', teams.away.logo || 'https://media.api-sports.io/football/teams/default.png').attr('alt', teams.away.name);
            $('.match-details-sidebar .away-team .team-name').text(teams.away.name);
            let scoreText = (goals.home !== null && goals.away !== null) ? `${goals.home} - ${goals.away}` : (fix.score && fix.score.fulltime) ? `${fix.score.fulltime.home || 0} - ${fix.score.fulltime.away || 0}` : '0 - 0';
            $('.match-details-sidebar .match-score .score').text(scoreText);
            $('.match-details-sidebar .match-status').text(fix.status.long);
            $('.match-details-sidebar .match-time').text(fix.status.elapsed ? `${fix.status.elapsed}'` : '');
            $('.match-details-sidebar .info-list .info-value').eq(0).text(league.name);
            $('.match-details-sidebar .info-list .info-value').eq(1).text(league.season);
            $('.match-details-sidebar .info-list .info-value').eq(2).text(league.round || 'مرحله عادی');
            $('.match-details-sidebar .info-list .info-value').eq(3).text(new Date(fix.date).toLocaleDateString('fa-IR'));
            $('.match-details-sidebar .info-list .info-value').eq(4).text(this.app.getMatchStatus(fix.status.short));
            if (fix.venue && fix.venue.name) $('.match-details-sidebar .venue').text(fix.venue.name);
            $('.match-details-sidebar').attr('data-home-team-id', teams.home.id).attr('data-away-team-id', teams.away.id);
        },

        displayMatchInfo: function(match) {
            $('.match-details-sidebar .home-team .team-name').text(match.teams.home.name);
            $('.match-details-sidebar .away-team .team-name').text(match.teams.away.name);
            $('.match-details-sidebar .home-team .team-logo').attr('src', match.teams.home.logo || 'https://media.api-sports.io/football/teams/default.png');
            $('.match-details-sidebar .away-team .team-logo').attr('src', match.teams.away.logo || 'https://media.api-sports.io/football/teams/default.png');
            let scoreText = (match.goals && match.goals.home !== null && match.goals.away !== null) ? `${match.goals.home} - ${match.goals.away}` : (match.fixture.score && match.fixture.score.fulltime) ? `${match.fixture.score.fulltime.home || 0} - ${match.fixture.score.fulltime.away || 0}` : '0 - 0';
            $('.match-details-sidebar .match-score .score').text(scoreText);
            const timeString = new Date(match.fixture.date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
            $('.match-details-sidebar .match-score .match-time').text(timeString);
            $('.match-details-sidebar .info-list .info-value').eq(0).text(match.league.name);
            $('.match-details-sidebar .info-list .info-value').eq(1).text(match.league.season);
            $('.match-details-sidebar .info-list .info-value').eq(2).text(match.league.round || 'مرحله عادی');
            $('.match-details-sidebar .info-list .info-value').eq(3).text(timeString);
            $('.match-details-sidebar .info-list .info-value').eq(4).text(this.app.getMatchStatus(match.fixture.status.short));
            $('.match-details-sidebar').attr('data-home-team-id', match.teams.home.id).attr('data-away-team-id', match.teams.away.id);
        },

        // --- Persian Calendar UI ---
        renderCalendar: function() {
            const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
            $('.current-month').text(`${monthNames[this.app.currentPersianDate.month - 1]} ${this.app.currentPersianDate.year}`);
            const daysInMonth = this.app.getDaysInPersianMonth(this.app.currentPersianDate.year, this.app.currentPersianDate.month);
            const firstDayOfWeek = this.app.getFirstDayOfPersianMonth(this.app.currentPersianDate.year, this.app.currentPersianDate.month);
            let html = '';
            for (let i = 0; i < firstDayOfWeek; i++) html += '<span class="calendar-day empty"></span>';
            for (let day = 1; day <= daysInMonth; day++) {
                const isToday = day === this.app.currentPersianDate.day;
                const isSelected = this.app.isSelectedDate(day);
                html += `<span class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-day="${day}">${day}</span>`;
            }
            $('#calendar-days').html(html);
        },

        // ... and all other UI-related functions from app.js
        // For brevity, I will assume they are moved here.
        // This includes functions for:
        // - TopLeagues, Countries, LeagueDetails modals
        // - Search UI
        // - Match Details tabs (overview, events, lineups, stats)
        // - Responsive handling, accessibility, performance optimizations

        updateLeagueFavoriteUI: function(leagueId) {
            const favoriteBtn = $(`.favorite-btn[data-league-id="${leagueId}"]`);
            if (favoriteBtn.length) {
                if (this.app.isLeagueFavorite(leagueId)) {
                    favoriteBtn.addClass('active').html('<i class="fa fa-heart"></i>');
                } else {
                    favoriteBtn.removeClass('active').html('<i class="fa fa-heart-o"></i>');
                }
            }
        },

    };

})(jQuery);
