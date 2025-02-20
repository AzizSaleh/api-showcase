/*
ooooooooo.                         ooooooooooooo                                  .
`888   `Y88.                       8'   888   `8                                .o8
 888   .d88'  .ooooo.  oooo    ooo      888       .ooooo.   .oooo.    .oooo.o .o888oo  .ooooo.  oooo d8b
 888ooo88P'  d88' `88b  `88.  .8'       888      d88' `88b `P  )88b  d88(  "8   888   d88' `88b `888""8P
 888`88b.    888ooo888   `88..8'        888      888   888  .oP"888  `"Y88b.    888   888ooo888  888
 888  `88b.  888    .o    `888'         888      888   888 d8(  888  o.  )88b   888 . 888    .o  888
o888o  o888o `Y8bod8P'     `8'         o888o     `Y8bod8P' `Y888""8o 8""888P'   "888" `Y8bod8P' d888b

Project: RevToaster
Version: 1
Author: michael@revcontent.com

RevToaster({
    api_key: 'your api_key',
    pub_id: pub_id,
    widget_id: widget_id,
    domain: 'widget domain',
    sponsored: 2,
    adp: true
});
*/

// universal module definition
( function( window, factory ) {
    'use strict';
    // browser global
    window.RevToaster = factory(window);

}( window, function factory(window) {
'use strict';

    // ----- vars ----- //

    var options;
    var lastScrollTop = 0;
    var scrollTimeout;
    var loading = false;
    var removed = false;
    var revToaster;

    function RevToaster( opts ) {
        options = extend(RevToaster.defaults, opts);

        if (validateApiParams(options).length) {
            return;
        }

        if (getCookie('revtoaster-closed') && !options.testing) {
            return;
        }

        appendStyle();

        options.sponsored = (options.sponsored > 2) ? 2 : options.sponsored;

        revToaster = document.createElement('div');
        addClass(revToaster, 'rev-toaster');
        if (options.sponsored > 1) {
            addClass(revToaster, 'rev-toaster-multi');
        }

        window.addEventListener('touchmove', move);
    };

    RevToaster.defaults = {
        testing: false,
        sponsored: 1,
        url: 'https://trends.revcontent.com/api/v1/'
    };

    var appendStyle = function() {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = '/* inject:css */[inject]/* endinject */';
        document.getElementsByTagName('head')[0].appendChild(style);
    }

    var isBlocked = function(e, o) {
        if ("undefined" != typeof document.body) {
            var t = "0.1.2-dev",
                o = o ? o : "sponsorText",
                n = document.createElement("DIV");
            n.id = o, n.style.position = "absolute";
            n.style.left = "-999px";
            n.appendChild(document.createTextNode("&nbsp;"));
            document.body.appendChild(n);
            setTimeout(function() {
                if (n) {
                    var o = 0 == n.clientHeight;
                    try {} catch (d) {
                        console && console.log && console.log("ad-block-test error", d)
                    }
                    e(o, t), document.body.removeChild(n)
                }
            }, 175)
        }
    }

    var getData = function(is_blocked) {
        loading = true;
        var url = options.url + '?api_key='+ options.api_key +'&pub_id='+ options.pub_id +'&widget_id='+ options.widget_id +'&domain='+ options.domain +'&sponsored_count=' + options.sponsored + '&sponsored_offset=0&internal_count=0&api_source=toast&is_blocked=' + is_blocked;

        var request = new XMLHttpRequest();

        request.open('GET', url, true);

        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                var resp = JSON.parse(request.responseText);

                var html = '<div class="rev-header">Trending Today</div>' +
                            '<button class="rev-close">' +
                                '<div class="icon">' +
                                    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
                                '</div>' +
                            '</button>';

                html += '<div class="rev-content">';

                for (var i = 0; i < resp.length; i++) {
                    html += '<div class="rev-ad">' +
                                '<a href="'+ resp[i].url +'">' +
                                    '<div class="rev-image"><img src="'+ resp[i].image +'"/></div>' +
                                    '<div class="rev-headline"><h3>'+ resp[i].headline +'</h3></div>' +
                                    '<div class="rev-provider">'+ resp[i].brand +'</div>' +
                                '</a>' +
                            '</div>';
                }

                html += '</div>';

                html += '<div class="rev-footer"><a href="http://revcontent.com">Sponsored by Revcontent</a></div>';

                revToaster.innerHTML = html;

                document.getElementsByTagName('body')[0].appendChild(revToaster);

                imagesLoaded( revToaster, function() {
                    addClass(document.body, 'rev-toaster-loaded');
                    loading = false;
                    bindClose();
                });
            } else {
                //error
            }
        };

        request.onerror = function() {
            //error
        };

        request.send();
    };

    var bindClose = function() {
        document.querySelector('.rev-close').addEventListener('click', function(e) {
            removeClass(document.body, 'rev-toaster-loaded');
            setTimeout(function() {
                revToaster.parentNode.removeChild(revToaster);
                removed = true;
                setCookie('revtoaster-closed', 1, 1);
            }, 2000);
        });
    };

    var move = function() {
        if (removed) {
            window.removeEventListener('touchmove', move);
            return;
        }

        if (loading || scrollTimeout) {
            return;
        }

        function delayed() {

            var scrollTop = window.pageYOffset,
                scrollDirection = (scrollTop < lastScrollTop) ? 'up' : 'down';

            if (scrollDirection === 'up' &&
                document.querySelector('.rev-toaster') === null) {

                if (options.adp == true) {
                    isBlocked(function(is_blocked) {
                        getData(is_blocked);
                    });
                } else {
                    getData(false);
                }

            } else if (scrollDirection === 'down' &&
                document.querySelector('.rev-toaster') !== null &&
                hasClass(document.body, 'rev-toaster-loaded')) {

                removeClass(document.body, 'rev-toaster-loaded');

            } else if (scrollDirection === 'up' &&
                document.querySelector('.rev-toaster') !== null &&
                !hasClass(document.body, 'rev-toaster-loaded')) {

                addClass(document.body, 'rev-toaster-loaded');
            }
            lastScrollTop = scrollTop;
            scrollTimeout = false;
        }

        scrollTimeout = setTimeout( delayed, 300);

    };

    var validateApiParams = function(params) {
        var errors = [];
        if (!params.sponsored){
            errors.push('sponsored');
        }
        if (!params.api_key){
            errors.push('api_key');
        }
        if (!params.pub_id){
            errors.push('pub_id');
        }
        if (!params.widget_id){
            errors.push('widget_id');
        }
        if (!params.domain){
            errors.push('domain');
        }
        return errors;
    }

    var extend = function( a, b ) {
      for ( var prop in b ) {
        a[ prop ] = b[ prop ];
      }
      return a;
    };

    var setCookie = function(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    };

    var getCookie = function(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    };

    var hasClass = function(el, className) {
        if (el.classList)
          return el.classList.contains(className);
        else
          return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
    }

    var addClass = function(el, className) {
        if (el.classList)
          el.classList.add(className);
        else
          el.className += ' ' + className;
    };

    var removeClass = function(el, className) {
        if (el.classList)
            el.classList.remove(className);
        else
            el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    };

    return RevToaster;

}));
