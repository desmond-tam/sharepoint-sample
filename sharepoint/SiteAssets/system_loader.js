var system_loader = {
    getToken:function () {
        console.log('Token: ' + _spPageContextInfo.formDigestValue);
    },
    getTick:function () {
        return Math.round(new Date().getTime()/(1000*60*1));
    },
    getBaseUrl:function () {
        var text = "/";
        function getpath() {
          var list = window.location.pathname.split('/');
          for (var i=0;i<list.length - 2;i++) {
              if (text != "/") {
                text = text + "/";
              }
              text = text + list[i];
          }
          return text;
        }
        //  getting the current folder of the site
        //  ignore the javascript cache
        const getUrl = window.location;
        const baseUrl = getUrl.protocol + "//" + getUrl.host + getpath();
        return baseUrl;
    },
    appendHolder:function () {
        var holder = document.getElementById("app-holder");
        holder.innerHTML = '';
	    // for angular
  	    var ng_root = document.createElement("app-root");
        holder.appendChild(ng_root);

        // <base href="/">
        var baseref = document.createElement("base");
        baseref.href = "/";
        document.getElementsByTagName("head")[0].appendChild(baseref);
    },
    loadBundle:function () {
        var that = this;
        var node = document.createElement('script');
        const url = `${this.getBaseUrl()}/siteassets/docuzone/static/bundle.js?${that.getTick()}`;
        node.src = url;
        node.type = 'text/javascript';
        node.async = false;
        document.getElementsByTagName('head')[0].appendChild(node);
    },
    loadStyles:function () {
        var that = this;
        $("head").append(`<link href='${this.getBaseUrl()}/siteassets/docuzone/static/styles.css?${that.getTick()}' type='text/css' rel='stylesheet' />`);
    },
    loadAll:function () {
        var that = this;
        $(document).ready(function () {
            that.appendHolder();
            that.loadStyles();
            that.loadBundle();
        });
    },
    hideSideNav:function () {
        // Hide the left navigation pane in SharePoint
        var sideNav = document.getElementById("zz14_RootAspMenu");
        if (sideNav) {
            sideNav.style.display = "none";
        }
    }
};

system_loader.loadAll();

