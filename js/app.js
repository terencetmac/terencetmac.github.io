var App = (function () {
	var config = {
		root: '#page-view',
		following: {
			showLatestEpisodes: 1
		},
		defaultNetworks: [
			{id: 1, name: 'NBC'},
			{id: 2, name: 'CBS'},
			{id: 3, name: 'ABC'},
			{id: 4, name: 'FOX'},
			{id: 5, name: 'CW'},
			{id: 8, name: 'HBO'},
			{id: 14, name: 'TNT'},
			{id: 20, name: 'AMC'},
			{id: 26, name: 'Freeform'},
			{id: 30, name: 'USA Network'},
		],
		watchButton: '.watchedEpisode-js',
		followButton: '.followShow-js',
		primeTime: ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00']
	},
	user = {
		settings: {
			timeslots: [],
			networks: []
		}
	},
	listings = [];

	function getRootElement () {
		return document.getElementById(config.root.substring(1));
	}

	function getWatchButton () {
		return config.watchButton.substring(1);
	}

	function getFollowButton () {
		return config.followButton.substring(1);
	}

	function setNetworks () {

	}
	// Listings organized by date
	function setListings (listings, date) {
		// has settings changed?
		var listingsObj = {};
		listingsObj[date] = listings;
		// Check if listing's date has been stored
		return this.listings = listingsObj;
	}

	// $ denotes a selector, returns reference to the element
	return {
		config: config,
		$root: getRootElement(),
		watchButton: getWatchButton(),
		followButton: getFollowButton(),
		listings: listings,
		setListings: setListings
	}
})();

/**
 * Simple AJAX Module
 * 
 * @return Promise
 */
var Fetch = (function () {

	function get (url) {
		return new Promise(function (resolve, reject) {
			httpRequest = new XMLHttpRequest();

			if (!httpRequest) {
				console.log("Failed to create XMLHTTP instance");
				return false;
			}

			httpRequest.open('GET', url);

			httpRequest.onload = function () {
				if ( this.status >= 200 && this.status < 300 ) {
					resolve(this.response);
				} else {
					reject({
						status: this.status,
						statusText: this.statusText
					})
				}
			}

			httpRequest.send();
		});
		
	}

	return {
		get: get
	}
})();

var DatePicker = (function () {
	var config = {
			element: '#today-js',
			nextBtn: '#next-date-js',
			prevBtn: '#prev-date-js',
			position: 'bottom left'
		},
		todayDate = new Date(),
		picker;

	function init () {

		picker = new Pikaday({
			field: document.getElementById(config.element.substring(1)),
			position: config.position,
			reposition: false,
			defaultDate: todayDate,
			setDefaultDate: true,
			onSelect: function (date) {
				picker.value = picker.toString();
				TvListing.getListing(picker.toString());
			}
		});
		_attachEventListeners();	
	}

	function _attachEventListeners () {
		document.getElementById(config.prevBtn.substring(1)).addEventListener('click', _goPrevDay, false);
		document.getElementById(config.nextBtn.substring(1)).addEventListener('click', _goNextDay, false);
	}

	function _goNextDay () {
		var testing = _tomorrow(picker.toString());
		picker.setDate(testing);

	}

	function _goPrevDay () {
		picker.setDate(_yesterday(picker.toString()));
	}

	// returns a Date String from a Javascript Date Object for DatePicker
	// E.g. 2016-10-01
	function formatDate (date) {
		var date = new Date(date),
			dateString = '',
			year = date.getFullYear(),
			month = date.getMonth() + 1,
			day = date.getDate();

		dateString += year + '-';
		dateString += ((parseInt(month)) < 10) ? '0' + month : month;
		dateString += '-';
		dateString += (day < 10) ? '0' + day : day;

		return dateString;
	}

	function today () {
		return todayDate;
	}

	function _tomorrow (date) {
		if (date) {
			var dateString = new Date(date);
			var testing = new Date(dateString.getFullYear(), dateString.getMonth(), dateString.getDate() +1);
			return testing;
		}
		var date = todayDate.getDate();
		return new Date(today.getFullYear(), today.getMonth(), date+1);
	}

	function _yesterday (date) {
		if (date) {
			var dateString = new Date(date);
			return new Date(dateString.getFullYear(), dateString.getMonth(), dateString.getDate() -1);
		}
		var date = todayDate.getDate();
		return new Date(today.getFullYear(), today.getMonth(), date-1);
	}

	function hide () {
		picker.destroy();
		return document.getElementById('date-picker').classList.add('hidden');
	}

	return {
		init: init,
		today: today,
		formatDate: formatDate,
		hide: hide
	}
})();

var Util = (function () {

	function compareByDates (a, b) {
		var dateA = new Date(a.airstamp);
		var dateB = new Date(b.airstamp);
		if (dateA > dateB) {
			return -1;
		} 

		if (dateA < dateB) {
			return 1;
		} 

		return 0;
	}

	function toArray(obj) {
		return Object.keys(obj).map(function (key) {
			return obj[key];
		});
	}

	return {
		compareByDates: compareByDates,
		toArray: toArray
	}
})();

var Store = (function () {

	function save (key, data) {
		_hasLocalStorage();

		try {
			localStorage.setItem(key, JSON.stringify(data));
			return true;
		} catch (err) {
			console.log(err.message);
		}

		return false;
	}

	function find (key) {
		_hasLocalStorage();

		var results = JSON.parse(localStorage.getItem(key));

		if (results) {
			return results;
		}

		return [];

	}

	function _hasLocalStorage () {
		if (!window.localStorage) {
			throw new Error('Your browser does not support localStorage.');
		}

		return true;
	}

	return {
		save: save,
		find: find
	}
})();

var FollowShows = (function () {

	var config = {
			el: '#following-shows',
			apiUrl: 'http://api.tvmaze.com/shows/'
		},
		following = [];

	function init () {

	}

	function _attachEventListeners () {
		document.getElementById(config.el.substring(1)).addEventListener('click', _showEpisodesCallback, false);
		document.getElementById(config.el.substring(1)).addEventListener('click', _watchedShowCallback, false);
	}

	function _showEpisodesCallback (event) {
		if ( event.target !== event.currentTarget && event.target.classList.contains('showEpisodes-js') ) {
			var showId = event.target.parentElement.dataset.showId;
			_showList(showId);
		}
	}

	function _watchedShowCallback (event) {
		var isWatchBtn = event.target.classList.contains(App.watchButton);
		if ( event.target !== event.currentTarget && isWatchBtn ) {
			var episodeId = event.target.parentElement.dataset.episodeId,
				showId = event.target.parentElement.dataset.showId;
			
			toggleWatched(showId, episodeId);
		}
	}

	// UI: Expand list of Episodes for each Following show
	function _showList(showId) {
		var list = document.querySelector('[data-show-id="' + showId + '"] ul'),
			showListBtn = document.querySelector('[data-show-id="' + showId + '"] .showEpisodes-js');
		
		// if there are no .hidden elements in list, that means the full list is being shown
		var hiddenChildren = list.querySelectorAll('.hidden'),
			fullListShown = hiddenChildren.length <= App.config.following.showLatestEpisodes ? true : false;

		// short list length hardcoded to 2
		if (fullListShown === true) {
			var listChildren = list.querySelectorAll('li');
			for (var i = App.config.following.showLatestEpisodes; i < listChildren.length; i++) {
				listChildren[i].classList.toggle('hidden');
			}
			return showListBtn.textContent = 'Show all Episodes \u25BC';
		}

		for (var i = 0; i < hiddenChildren.length; i++) {
			hiddenChildren[i].classList.toggle('hidden');
		}
		return showListBtn.textContent = 'Hide Episodes \u25B2';
	}

	function followShow (showId) {
		var followingShows = Store.find('following_shows');
		var exists = followingShows.some(function (val) {
			return val == showId;
		});

		if (exists) {
			return;
		}
		// add show to the Following Show list
		followingShows.push(showId);
		return Store.save('following_shows', followingShows);
	}

	function unfollowShow (showId) {
		var followingShows = Store.find('following_shows');
		var filteredList = followingShows.filter(function (val) {
			return val != showId;
		});
		// TODO: Remove Watched Episodes when User unfollows Show, leaving in for now
		return Store.save('following_shows', filteredList);
	}

	/**
	 * Checks if User Is Following a Show by Id.
	 * @param  {integer}  showId 
	 * @return {Boolean}  Array of Shows, false      
	 */
	function isFollowing(showId) {
		var list = Store.find('following_shows');
		if ( list ) {
			return list.some(function (val) {
				return val == showId;
			});
		}
		return false;
	}

	function addWatchedEpisode (showId, episodeId) {

		var watchedEpisodes = Store.find('watched_episodes');

		var watchedExists = watchedEpisodes.some(function (val) {
			return val.id === showId;
		});

		if ( !watchedExists ) {
			// create a new entry
			watchedEpisodes.push(
				{
					id: showId,
					episodes: [episodeId]
				}
			);
			return Store.save('watched_episodes', watchedEpisodes);
		}

		watchedEpisodes.forEach(function (val) {
			if (val.id === showId) {
				var exists = val['episodes'].some(function (el) {
					return el === episodeId;
				});
				if (!exists) {
					val['episodes'].push(episodeId);
				}
				// episode already watched
			}			
		});
		
		return Store.save('watched_episodes', watchedEpisodes);
	}

	function removeWatchedEpisode(showId, episodeId) {
		var watchedEpisodes = Store.find('watched_episodes');

		// Mutate WatchedEpisodes array
		// 1. Match ShowId
		// 2. Find index of EpisodeId
		// 3. Remove from Array and Save to Store
		watchedEpisodes.forEach(function (val) {
			if (val.id === showId.toString()) {
				var index = val['episodes'].indexOf(episodeId.toString());
				if ( index > -1) {
					val['episodes'].splice(index, 1);
				}
			}
		});
		return Store.save('watched_episodes', watchedEpisodes);
	}

	// get an array of episodes from the most recent season
	function getRecentSeason(episodes) {
		var recentSeasonId = episodes.pop().season;
		return episodes.filter(function (val) {
			return val.season === recentSeasonId;
		});
	}

	function isWatched (episodeId) {

		var isWatched = Store.find('watched_episodes').filter(function (val) {
			if (val.episodes.indexOf(episodeId.toString()) < 0) {
				return false;
			}
			return true;
		});
		if (isWatched.length > 0) {
			return true;
		}

		return false;
	}

	function toggleWatched (showId, episodeId) {
		var watched = isWatched(episodeId);

		if (watched) {
			return _unwatchEpisode(showId, episodeId);
		}
		return _watchEpisode(showId, episodeId);
	}

	function _unwatchEpisode (showId, episodeId) {
		if (removeWatchedEpisode(showId, episodeId)) {
			var button = document.querySelector('[data-episode-id="' + episodeId + '"] .watchedEpisode-js') 
			button.classList.toggle('is-watched');
			button.textContent = 'Mark watched';
		}
	}

	function _watchEpisode (showId, episodeId) {
		if (addWatchedEpisode(showId, episodeId)) {
			var button = document.querySelector('[data-episode-id="' + episodeId + '"] .watchedEpisode-js') 
			button.classList.toggle('is-watched');
			button.textContent = 'Watched';
		}
	}

	function populateShowInfo(shows) {
		return Promise.all(shows.map(function (show) {
			return Fetch.get(config.apiUrl + show + '?embed=episodes').then(function (results) {
				return JSON.parse(results);
			});
		}));
	}

	function render () {
		console.log('following render');
		
		var list = Store.find('following_shows'),
			str = '';

		populateShowInfo(list).then(function (results) {
			console.log(results);
			str = '<div id="following-shows">';
			str += '<div class="row">';
			str += '<div class="small-12 columns">';
			results.forEach(function (val) {
				var recentSeasonArray = getRecentSeason(val['_embedded']['episodes']);
				recentSeasonArray.forEach(function (el) {
					el['watched'] = isWatched(el.id);
				});

				recentSeasonArray.sort(Util.compareByDates);

				var showId = val.id;
				str+= '<div class="media-object">';
					str+= '<div class="media-object-section">'
					if (val.image) {
						str+= '<div class="thumbnail">';
						str+= '<img style="height: 80px;" src="' + val.image.medium + '">';
						str+= '</div>';
					}
					str+= '</div>';
					str+= '<div class="media-object-section" style="width: 100%;">';
						// str+= '<div style="vertical-align: middle" data-show-id="' + val.show.id + '"><strong>' + val.show.name + ' on ' + val.show.network.name + '</strong>';
						// if (val.isFollowing) {
						// 	str+= '<a class="tiny button is-following followShow-js">Following</a></div>';
						// } else {
						// 	str+= '<a class="tiny button followShow-js">Follow</a></div>';
						// }
						// str+= '<p> S' + val.season + 'E' + val.number + ' ' + val.name + ' at ' + val.airtime;
						str+= '<div style="vertical-align: middle; overflow: hidden;" data-show-id="' + val.id + '">';
						str+= '<strong>' + val.name + ' on ' + val.network.name + '</strong>';
						str+= '<ul style="list-style: none;margin-bottom: 0;">';
						str+= '<div style="text-align: center;"><em><small>- Latest Episode - </small></em></div>';
						recentSeasonArray.forEach(function (val, index) {
							var isHidden = index >= App.config.following.showLatestEpisodes ? 'hidden' : '';
							str+= '<li class="' + isHidden + '" ';
							str += 'style="border:1px solid #ccc;padding: 10px 5px 10px 10px;overflow:hidden;" data-show-id="' + showId + '" data-episode-id="' + val.id + '">';
							var date = new Date(val.airstamp);
							// console.log(val.airstamp);
							// console.log(DatePicker.today().toLocaleDateString());
							// console.log(DatePicker.today().toLocaleDateString(), date.toLocaleDateString());
							// console.log(DatePicker.today().toLocaleDateString() < date.toLocaleDateString());
							if (+DatePicker.today().toLocaleDateString() < +date.toLocaleDateString()) {
								str+='upcoming';
							}
							var airedOn = date.getMonth() + '/' + date.getDate() + '/' + date.getFullYear();
							str+= 'S' + val.season + 'E' + val.number + ' ' + val.name + ' aired on ' + airedOn;
							if (val.watched) {
								str+= '<a class="float-right watchedEpisode-js is-watched button tiny">Watched';
							} else {
								str+= '<a class="float-right watchedEpisode-js button tiny">Mark watched';
							}
							str+= '</a>';
							str+= '</li>';
						});
						str+= '</ul>';
						str+= '<div style="margin-left: 20px;background-color: #ccc; text-align: center; cursor: pointer" class="showEpisodes-js">Show all Episodes \u25BC</div>';
						str+= '</div>';
					str+= '</div>';
				str+= '</div>';
			}.bind(this));
			str += '</div></div></div>'; 
			
			return App.$root.innerHTML = str;
		}.bind(this), function (err) {
			console.log(err);
		}).then(function () {
			_attachEventListeners();
		});
	}

	return {
		followShow: followShow,
		unfollowShow: unfollowShow,
		isFollowing: isFollowing,
		toggleWatched: toggleWatched,
		isWatched: isWatched,
		render: render
	}
})();

var TvListing = (function () {

	var config = {
		el: '#tv-listing',
		followBtn: '.followShow-js',
		apiUrl: 'http://api.tvmaze.com/schedule?country=US&date='
	};

	function init () {
		DatePicker.init();
		getListing(new Date());
	};

	function getListing(date) {
		var date = DatePicker.formatDate(date);

		if ( ! App.listings[date] ) {
			return Fetch.get(config.apiUrl + date)
				.then(function (results) {
					console.log("Fetching...");
					var processed = Util.toArray(JSON.parse(results));
					App.setListings(processed, date); // store in memory
					_formatShows(processed);
				});
		}

		return _formatShows(App.listings[date]);
	}

	function _attachEventListeners() {
		document.getElementById(config.el.substring(1)).addEventListener('click', _markWatchedCallback, false);
		document.getElementById(config.el.substring(1)).addEventListener('click', _followShowCallback, false);
	}

	function _markWatchedCallback (event) {
		var isWatchBtn = event.target.classList.contains(App.watchButton);
		if ( event.target !== event.currentTarget && isWatchBtn ) {
			console.log('true: ', event.target.className);
			var showId = event.target.parentElement.dataset.showId;
			var episodeId = event.target.parentElement.dataset.episodeId;
			console.log(episodeId);
			return FollowShows.toggleWatched(showId, episodeId);
		}
	}

	function _followShowCallback () {
		if ( event.target !== event.currentTarget && event.target.classList.contains(App.followButton) ) {
			var showId = event.target.parentElement.dataset.showId;

			// Check current Following state of Show
			if ( FollowShows.isFollowing(showId) ) {
				_unfollowShow(showId);
			} else {
				_followShow(showId);
			}
		}
	}

	function _followShow (showId) {
		if (FollowShows.followShow(showId)) {
			var button = document.querySelector('[data-show-id="' + showId + '"] .' + App.followButton) 
			button.classList.toggle('is-following');
			button.textContent = 'Following';
		}
	}

	function _unfollowShow (showId) {
		if (FollowShows.unfollowShow(showId)) {
			var button = document.querySelector('[data-show-id="' + showId + '"] .' + App.followButton) 
			button.classList.toggle('is-following');
			button.textContent = 'Follow';
		}
	}

	function _formatShows (listing) {

		var byPrimeTime = _filterPrimeTimeslots(listing);

		var byNetworks = _filterDefaultNetworks(byPrimeTime);
		
		// Adds Following and Watched meta data to shows
		_render(_populateShowMetaData(byNetworks));
	}

	function _filterPrimeTimeslots (shows) {
		return shows.filter(function (val) {
			return App.config.primeTime.some(function (value) {
				return val.airtime == value;
			})
		});
	}

	function _filterDefaultNetworks (shows) {
		return shows.filter(function (val) {
			return App.config.defaultNetworks.some(function (value) {
				return val.show.network.id === value.id;
			});
		});
	}

	// Adds isFollowing and isWatched meta data to shows
	function _populateShowMetaData (shows) {
		return shows.map(function (val) {
			val['isFollowing'] = FollowShows.isFollowing(val.show.id);
			val['isWatched'] = FollowShows.isWatched(val.id);
			return val;
		});	
	}

	// Returns HTML
	function _ui_followingButton (isFollowing) {
		if ( isFollowing ) {
			return '<a class="tiny button is-following float-right ' + App.followButton + '">Following</a>';
		}
		return '<a class="tiny button float-right ' + App.followButton + '">Follow</a>';
	}

	function _ui_watchedButton (isWatched) {
		if ( isWatched ) {
			return '<a class="small button float-right is-watched ' + App.watchButton + '">Watched</a>';
		}
		return '<a class="small button float-right ' + App.watchButton + '">Mark watched</a>';
	}

	// Returns HTML of Media Objects given Prime Time Shows
	function _render (shows) {

		var str = '';
			str += '<div id="tv-listing">';
		shows.forEach(function (val) {
			str += '<div class="media-object">';
				str += '<div class="media-object-section">'
				if (val.show.image) {
					str += '<div class="thumbnail">';
					str += '<img style="height: 80px;" src="' + val.show.image.medium + '">';
					str += '</div>';
				}
				str += '</div>';
				str += '<div class="media-object-section" style="width: 100%;">';
					str += '<div style="vertical-align: middle; overflow: hidden;" data-show-id="' + val.show.id + '">';
					str += '<strong>' + val.show.name + ' on ' + val.show.network.name + '</strong>';
					str += _ui_followingButton(val.isFollowing);
					str += '</div>'; // title
					str += '<div class="callout" style="overflow: hidden;" data-show-id="' + val.show.id + '" data-episode-id="' + val.id + '"> S' + val.season + 'E' + val.number + ' ' + val.name;
					str += '<span class="secondary label float-right">' + val.airtime + '</span>';
					
					str += val.isFollowing ? _ui_watchedButton(val.isWatched) : '';
					
					str += '</div>';
				str += '</div>';
			str += '</div>';
		});

		str += '</div>';
		
		App.$root.innerHTML = str;
		_attachEventListeners();
	}

	return {
		init: init,
		getListing: getListing
	}
})();

var Settings = (function () {

	function _ui_defaultNetworks () {		
		return [
			'<ul>',
				App.config.defaultNetworks.reduce(function (prevVal, currVal) {
					return prevVal + '<label><input type="checkbox" value="' + currVal.id + '" checked>' + currVal.name + '</label>';
				}, ''),
			'</ul>',
		].join(' ');
	}

	function render () {
		var arr = [
			'<h2>TV Listing</h2>',
			'<button class="small button float-right">save</button>',
			'<ul>',
			'<li><label>Show Timeslots: ',
			'<input type="text" id="user_timeslots" value="' + App.config.primeTime + '"',
			'</label></li>',
			'<li>Featured Networks: ',
				_ui_defaultNetworks(),
			'</li>',
			'<li>Others: ',
				'<ul>',
				'<li><label><input type="checkbox">FOX News</label>',
				'</li>',
				'</ul>',
			'</li>',
			'</ul>',
		].join(' ');
		return App.$root.innerHTML = arr;
	}

	return {
		render: render
	}

})();

var SearchShows = (function () {

	function showSearchBar () {
		var str = '';
		str += '<div>Search</div>'
		return str;
	}

	var render = function () {
		var el = document.getElementById('page-view');
		var str = '';
		str+= showSearchBar();
		return el.innerHTML = str;
	}

	return {
		render: render
	}
})();

/**
 * Very Basic Router.
 *
 * 1. Uses onload event to handle page load
 * 2. Uses onhashchange event to handle route changes after page has loaded
 * @type {Object}
 */
var Router = {
	routes: {},
	root: '/settings',
	init: function () {
		// console.log('init: ',this.routes);
		// console.log("Routes: ", this.routes);
		this.route();
		this.events();
	},
	events: function () {
		window.addEventListener('hashchange', function () {
			console.log('change');
			this.route();
		}.bind(this));	
		// // window.addEventListener('load', function () {
		// 	console.log('load');
		// 	this.route();
		// }.bind(this));
	},

	route: function () {
		var url = location.hash.slice(1) || '/';
		
		if (url === '/') {
			return window.location.hash = this.root;
		}
		
		if ( this.routes && this.routes[url.substring(1)] ) {
			this.routes[url.substring(1)].handler();
			return this.updateNavBar(this.routes[url.substring(1)].re);
		}
	},

	add: function (route, callback) {
		// console.log("Route added: ", route);
		this.routes[route.substring(1)] = {
			re: route,
			handler: callback
		}
	},

	updateNavBar: function (newUrl) {
		var nav = document.getElementById('mainNav-js');
		// remove .active
		nav.querySelector('.active').classList.remove('active');
		// add .active
		return nav.querySelector('a[href="#' + newUrl + '"]').parentElement.classList.add('active');
	}
};

Router.add('/following', function () {
	FollowShows.render();
	DatePicker.hide();
});

Router.add('/listing', function () {
	TvListing.init();
	document.getElementById('date-picker').classList.remove('hidden');
});

Router.add('/search', function () {
	SearchShows.render();
	DatePicker.hide();
});

Router.add('/settings', function () {
	Settings.render();
	DatePicker.hide();
});

Router.init();

