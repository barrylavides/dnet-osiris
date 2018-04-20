const electron = require('electron')
const remote = electron.remote
var nodeConsole = require('console');
var _console = new nodeConsole.Console(process.stdout, process.stderr);

var jsonfile = require('jsonfile');
var favicon = require('favicon-getter').default;
var path = require('path');
var uuid = require('uuid');
var bookmarks = path.join(__dirname, 'bookmarks.json');
var downloadHistoryFile = path.join(__dirname, 'download_history.json');

var osiris_settings = path.join(__dirname, 'settings.json');

var getElementById = function (id) {
    return document.getElementById(id);
}

var backBtn = getElementById('back');
var forwardBtn = getElementById('forward');
var refreshBtn = getElementById('refresh');
var urlBtn = getElementById('url');
// var view = getElementById('view');
var view = document.getElementsByClassName('view-instance')[0];
var omnibox = getElementById('url');
var fave = getElementById('fave');
var list = getElementById('list');
var popup = getElementById('fave-popup');
var addTabBtn = getElementById('nav-tabs-add');
var speedDial = getElementById('speed-dial');

function reloadView () {
    var activeIndex = $('.view-instance.active').index();

    document.getElementsByClassName('view-instance')[activeIndex].reload();
}

function showUrl (event) {
    omnibox.value = view.src;
}

function loadSiteUrl (event) {
    var activeIndex = $('.view-instance.active').index();

    // 13 is Enter key
    if (event.keyCode === 13) {
        // Remove focus
        omnibox.blur();

        let val = omnibox.value.toLowerCase();
        var url = '';

        if (val.indexOf('http') < 0) {
            url = 'http://'+ val;
        }

        if (val.indexOf('.com') < 0) {
            url = url + '.com'
        }

        document.getElementsByClassName('view-instance')[activeIndex].loadURL(url)

        // Update tab title based on the loaded site
        document.getElementsByClassName('view-instance')[activeIndex].addEventListener('did-finish-load', function() {
            let title = document.getElementsByClassName('view-instance')[activeIndex].getTitle().split(' ')[0];

            $('span#tab'+(activeIndex+1)+' i.nav-tabs-title').text(title);
        });
    }
}

function backView () {
    var activeIndex = $('.view-instance.active').index();

    document.getElementsByClassName('view-instance')[activeIndex].goBack();
}

function forwardView () {
    var activeIndex = $('.view-instance.active').index();

    document.getElementsByClassName('view-instance')[activeIndex].goForward();
}

var Bookmark = function (id, url, faviconUrl, title) {
    this.id = id;
    this.url = url;
    this.icon = faviconUrl;
    this.title = title;
}

Bookmark.prototype.ELEMENT = function () {
    var a_tag = document.createElement('a');
    a_tag.href = this.url;
    a_tag.className = 'link';
    a_tag.textContent = this.title;
    var favimage = document.createElement('img');
    favimage.src = this.icon;
    favimage.className = 'favicon';
    a_tag.insertBefore(favimage, a_tag.childNodes[0]);

    return a_tag;
}

function addBookmark () {
    var activeIndex = $('.view-instance.active').index();
    var view = document.getElementsByClassName('view-instance')[activeIndex];
    let url = view.src;
    let title = view.getTitle().split(' ')[0];

    favicon(url).then(function(fav) {
        let book = new Bookmark(uuid.v1(), url, fav, title);
        var data = []

        jsonfile.readFile(bookmarks, function(err, curr) {
            if (curr === undefined) {
                curr = [book]
            } else {
                curr.push(book);
            }

            jsonfile.writeFile(bookmarks, curr, function (err) {
            })
        });
    });
}

function openPopUp (event) {
    let state = popup.getAttribute('data-state');

    if (state === 'closed') {
        popup.innerHTML = '';

        popup.style.display = 'block';
        popup.setAttribute('data-state', 'open');

        jsonfile.readFile(bookmarks, function(err, obj) {
            if(obj.length !== 0) {
                for (var i = 0; i < obj.length; i++) {
                    let url = obj[i].url;
                    let icon = obj[i].icon;
                    let id = obj[i].id;
                    let title = obj[i].title;
                    let bookmark = new Bookmark(id, url, icon, title);
                    let el = bookmark.ELEMENT();

                    popup.appendChild(el);
                }
            }
        });
    } else {
        popup.style.display = 'none';
        popup.setAttribute('data-state', 'closed');
    }
}

function handleUrl (event) {
    var activeIndex = $('.view-instance.active').index();

    if (event.target.className === 'link') {
        event.preventDefault();

        document.getElementsByClassName('view-instance')[activeIndex].loadURL(event.target.href);
    } else if (event.target.className === 'favicon') {
        event.preventDefault();
        view.loadURL(event.target.parentElement.href);
    }
}

function addNavTab(id) {
    var element = '<span id="tab'+ id +'" class="nav-tabs-tab" data-session="4">\
            <i class="nav-tabs-favicon nav-icons">\
                <svg height="100%" viewBox="0 0 24 24" fill="#ffffff">\
                    <path d="M0 0h24v24H0z" fill="none"></path>\
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"></path>\
                </svg>\
            </i>\
            <i class="nav-tabs-title" title="Google">Google</i>\
            <i class="nav-tabs-close nav-icons">\
                <svg height="100%" viewBox="0 0 24 24">\
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>\
                    <path d="M0 0h24v24H0z" fill="none"></path>\
                </svg>\
            </i>\
        </span>'

    $(element).insertBefore('#nav-tabs-add');
}

function addTab (event) {
    // Create new webview tag and increment view id
    // Remove active class from the previous view
    var lastWebviewIndex = document.getElementsByTagName('webview').length - 1;
    var lastWebviewId = document.getElementsByTagName('webview')[lastWebviewIndex].id;
    var lastIndex = parseInt(lastWebviewId.split('view')[1]);
    $('webview')[lastWebviewIndex].className = 'view-instance';

    // Create new webview tag and increment view id
    var webviewTag = document.createElement('webview');
    webviewTag.className = 'view-instance active';
    webviewTag.src = 'default.html'; //loading of URL updated to default from google.com
    var newIndex = lastIndex + 1;
    webviewTag.id = 'view'+ newIndex;

    getElementById('view-container').insertBefore(webviewTag, getElementById('webview-reference'))

    // Create new tab elements and increment the tab id
    addNavTab(newIndex)


    // Update url in address bar
    //   - when creating new tabs
    var activeIndex = $('.view-instance.active').index();

    document.getElementsByClassName('view-instance')[activeIndex].addEventListener('did-finish-load', function() {
        var url = document.getElementsByClassName('view-instance')[activeIndex].getURL();

        omnibox.value = url;
    });
}

function switchTab(event) {
    var tabId = parseInt($(this).attr('id').replace('tab',''));
    var url = $('#view'+tabId).attr('src');

    $('webview').removeClass('active');
    $('#view'+tabId).addClass('active');

    // Update url in address bar when switching tabs
    omnibox.value = url;
}

function closeTab(event) {
    event.stopPropagation();

    var selectedId = parseInt($(this).parent().attr('id').replace('tab',''));
    var prevViewId = selectedId - 1;
    var url = $('#view'+prevViewId).attr('src');

    $('#tab'+selectedId).remove();
    $('webview').removeClass('active');
    $('#view'+prevViewId).addClass('active');

    // Update url in address bar when deleting tabs
    omnibox.value = url;
}
//Defaut settings tab (History, Speed Dial)
function defaultSettings(){
  var element = '<span id="tab'+ id +'" class="nav-tabs-tab" data-session="4">\
          <i class="nav-tabs-favicon nav-icons">\
              <svg height="100%" viewBox="0 0 24 24" fill="#ffffff">\
                  <path d="M0 0h24v24H0z" fill="none"></path>\
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"></path>\
              </svg>\
          </i>\
          <i class="nav-tabs-title" title="Google">Google</i>\
          <i class="nav-tabs-close nav-icons">\
              <svg height="100%" viewBox="0 0 24 24">\
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>\
                  <path d="M0 0h24v24H0z" fill="none"></path>\
              </svg>\
          </i>\
      </span>'

  $(element).insertBefore('#nav-tabs-add');
}

function downloadHistory() {
    jsonfile.readFile(downloadHistoryFile, function(err, obj) {
        Object.keys(obj).forEach(function(key) {
            var val = obj[key];

            if (val.files.length > 1) {
                for(var i=0; i<val.files.length; i++) {
                    $('#download-list div.list').append('<div class="row">\
                      <div class="col-xs-2 col-sm-2 col-md-2 col-lg-2">\
                        <div class="download-icon">\
                          <img src="assets/img/pdf-download-icon.png" alt="">\
                        </div>\
                      </div>\
                      <div class="col-xs-10 col-sm-10 col-md-10 col-lg-10">\
                        <div class="download-content">\
                          <div class="download-remove">\
                            <i class="fa fa-times"></i>\
                          </div>\
                          <h1>'+ val.files[i].title +'</h1>\
                          <div class="">\
                            <a href="#" id="download-url">'+ val.files[i].title +'</a>\
                          </div>\
                          <div class="" style="margin-top: 18px;">\
                            <a href="#" class="download-url-show-in-folder">Show in folder</a>\
                          </div>\
                        </div>\
                      </div>\
                    </div>')
                }
            } else {
                $('#download-list div.list').append('<div class="row">\
                  <div class="col-xs-2 col-sm-2 col-md-2 col-lg-2">\
                    <div class="download-icon">\
                      <img src="assets/img/pdf-download-icon.png" alt="">\
                    </div>\
                  </div>\
                  <div class="col-xs-10 col-sm-10 col-md-10 col-lg-10">\
                    <div class="download-content">\
                      <div class="download-remove">\
                        <i class="fa fa-times"></i>\
                      </div>\
                      <h1>'+ val.files[0].title +'</h1>\
                      <div class="">\
                        <a href="#" id="download-url">'+ val.files[0].title +'</a>\
                      </div>\
                      <div class="" style="margin-top: 18px;">\
                        <a href="#" class="download-url-show-in-folder">Show in folder</a>\
                      </div>\
                    </div>\
                  </div>\
                </div>')
            }
        });
    });
}

downloadHistory()

function loadStartupSettings(){
    jsonfile.readFile(osiris_settings, function(err, startup) {
        //console.dir(startup.osirisStartUp[0]['startPage']);
        switch(startup.osirisStartUp[0]['selected']){
            case "1": {
                // Create new webview tag and increment view id
                // Remove active class from the previous view
                var webviewTag = document.getElementById('view2');
                webviewTag.src = 'default.html'; //loading of URL updated to default from google.com
                break;
            }
            case "2": {
                var webviewTag = document.getElementById('view2');
                webviewTag.src = startup.osirisStartUp[0]['lastBrowseURL'];

                omnibox.value = webviewTag.src;
                break;
            }
            case "3": {

                var webviewTag = document.getElementById('view2');
                var specPageSelected = startup.osirisStartUp[0]['specificPagesSelected'];
                webviewTag.src = startup.osirisStartUp[0]['specificPagesList'][0][specPageSelected];

                omnibox.value = webviewTag.src;
                break;
            }
            default: {
                console.dir('Undefined selected Startup Page');
                break;
            }
        }
    });
}

// ------------------------------
// --           EVENTS
// ------------------------------

refreshBtn.addEventListener('click', reloadView);
omnibox.addEventListener('keydown', loadSiteUrl);
backBtn.addEventListener('click', backView);
forwardBtn.addEventListener('click', forwardView);


// var activeIndex = $('.view-instance.active').index();
// document.getElementsByClassName('view-instance')[activeIndex].addEventListener('did-finish-load', showUrl);
loadStartupSettings();


fave.addEventListener('click', addBookmark);
list.addEventListener('click', openPopUp);
popup.addEventListener('click', handleUrl);

//Defaut settings

// Add tab
addTabBtn.addEventListener('click', addTab);

// Switch tabs
$(document.body).on('click', '.nav-tabs-tab', switchTab);

// Delete tab
$(document.body).on('click', '.nav-tabs-close', closeTab);
// Forward, back and refresh buttons on selected tab
// Load selected bookmark on the selected tab


let win = remote.getCurrentWindow();
win.setDownloadSavePath('/Users/barry.lavides/Downloads/electron-files');



