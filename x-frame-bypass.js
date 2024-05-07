customElements.define('x-frame-bypass', class extends HTMLIFrameElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.load(this.src);
        this.src = '';
        this.sandbox = '' + this.sandbox || 'allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation-by-user-activation'; // all except allow-top-navigation
    }
    load(url, options) {
        if (!url || !url.startsWith('http'))
            throw new Error(`X-Frame-Bypass src ${url} does not start with http(s)://`);
        console.log('X-Frame-Bypass loading:', url);
        this.srcdoc = `<html>
<head>
	<style>
	.loader {
		position: absolute;
		top: calc(50% - 25px);
		left: calc(50% - 25px);
		width: 50px;
		height: 50px;
		background-color: #333;
		border-radius: 50%;  
		animation: loader 1s infinite ease-in-out;
	}
	@keyframes loader {
		0% {
		transform: scale(0);
		}
		100% {
		transform: scale(1);
		opacity: 0;
		}
	}
	</style>
</head>
<body>
	<div class="loader"></div>
</body>
</html>`;
        this.fetchProxy(url, options, 0).then(res => res.text()).then(data => {
            if (data)
              	data.replace(/<head([^>]*)>/i, `<head$1>
	<base href="${url}">
	<script>
	// X-Frame-Bypass navigation event handlers
	document.addEventListener('click', e => {
		if (frameElement && document.activeElement && document.activeElement.href) {
			e.preventDefault()
			frameElement.load(document.activeElement.href)
		}
	})
	document.addEventListener('submit', e => {
		if (frameElement && document.activeElement && document.activeElement.form && document.activeElement.form.action) {
			e.preventDefault()
			if (document.activeElement.form.method === 'post')
				frameElement.load(document.activeElement.form.action, {method: 'post', body: new FormData(document.activeElement.form)})
			else
				frameElement.load(document.activeElement.form.action + '?' + new URLSearchParams(new FormData(document.activeElement.form)))
		}
	})
	</script>`);
                this.srcdoc = injectBase(data, url);
}).catch(e => {
  console.error('Cannot load X-Frame-Bypass:', e); 
  alert('Cannot load X-Frame-Bypass: ', e);
});
    }

    injectBase(html, base) {
        // Remove any <base> elements inside <head>     
        html = html.replace(/(<[^>/]*head[^>]*>)[\s\S]*?(<[^>/]*base[^>]*>)[\s\S]*?(<[^>]*head[^>]*>)/img, "$1 $3");
		
        // Add <base> just before </head>  
        html = html.replace(/(<[^>/]*head[^>]*>[\s\S]*?)(<[^>]*head[^>]*>)/img, `$1 ` + base + " $2");
        return (html);
    }
    fetchProxy(url, options, i) {
        const proxy = [
	    'https://api.allorigins.win/get?url=',
	    'https://api.codetabs.com/v1/proxy/?quest=',
            'https://corsproxy.io/?',
	    'https://cors-anywhere.herokuapp.com/',
            'https://cors.io?',
            'https://jsonp.afeld.me/?url=',
	    'http://71.143.151.139:25565/',
	    'http://71.143.151.139:8080/proxy/?url='
        ];
        return fetch(proxy[i] + url, options).then(res => {
            if (!res.ok)
                throw new Error(`${res.status} ${res.statusText}`);
            return res;
        }).catch(error => {
            if (i === proxy.length - 1)
                throw error;
            console.log(proxy[i]);
            return this.fetchProxy(url, options, i + 1);
        });
    }
}, {
    extends: 'iframe'
});
