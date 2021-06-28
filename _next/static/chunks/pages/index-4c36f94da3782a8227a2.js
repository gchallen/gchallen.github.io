(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[405],{8533:function(e,n,t){"use strict";var r=t(5893),s=t(1664);n.Z=function(e){var n=e.published,t=e.h1,a=void 0!==t&&t;return(0,r.jsx)(r.Fragment,{children:n.length>0&&(0,r.jsxs)(r.Fragment,{children:[a?(0,r.jsx)("h2",{className:"h1",children:"Essays"}):(0,r.jsx)(s.default,{href:"/essays/",children:(0,r.jsx)("a",{className:"inverted-link",children:(0,r.jsx)("h2",{children:"Essays"})})}),(0,r.jsx)("p",{children:"I post essays here on teaching, technology, and the overlap between the two. I try to keep my essays on teaching accessible to teachers who don't program, and my essays on technology interesting to programmers who don't teach."}),n.slice(0,5).map((function(e,n){var t=e.title,a=e.description,o=e.publishedAt,c=e.url;return(0,r.jsxs)("div",{children:[(0,r.jsx)("h3",{children:(0,r.jsx)(s.default,{href:"/".concat(c),children:(0,r.jsxs)("a",{children:[o," : ",t]})})}),(0,r.jsx)("p",{children:a})]},n)}))]})})}},2167:function(e,n,t){"use strict";var r=t(3848),s=t(9448);n.default=void 0;var a=s(t(7294)),o=t(9414),c=t(4651),i=t(7426),l={};function u(e,n,t,r){if(e&&(0,o.isLocalURL)(n)){e.prefetch(n,t,r).catch((function(e){0}));var s=r&&"undefined"!==typeof r.locale?r.locale:e&&e.locale;l[n+"%"+t+(s?"%"+s:"")]=!0}}var d=function(e){var n,t=!1!==e.prefetch,s=(0,c.useRouter)(),d=a.default.useMemo((function(){var n=(0,o.resolveHref)(s,e.href,!0),t=r(n,2),a=t[0],c=t[1];return{href:a,as:e.as?(0,o.resolveHref)(s,e.as):c||a}}),[s,e.href,e.as]),f=d.href,h=d.as,p=e.children,v=e.replace,y=e.shallow,x=e.scroll,m=e.locale;"string"===typeof p&&(p=a.default.createElement("a",null,p));var g=(n=a.Children.only(p))&&"object"===typeof n&&n.ref,j=(0,i.useIntersection)({rootMargin:"200px"}),_=r(j,2),b=_[0],I=_[1],w=a.default.useCallback((function(e){b(e),g&&("function"===typeof g?g(e):"object"===typeof g&&(g.current=e))}),[g,b]);(0,a.useEffect)((function(){var e=I&&t&&(0,o.isLocalURL)(f),n="undefined"!==typeof m?m:s&&s.locale,r=l[f+"%"+h+(n?"%"+n:"")];e&&!r&&u(s,f,h,{locale:n})}),[h,f,I,m,t,s]);var E={ref:w,onClick:function(e){n.props&&"function"===typeof n.props.onClick&&n.props.onClick(e),e.defaultPrevented||function(e,n,t,r,s,a,c,i){("A"!==e.currentTarget.nodeName||!function(e){var n=e.currentTarget.target;return n&&"_self"!==n||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.nativeEvent&&2===e.nativeEvent.which}(e)&&(0,o.isLocalURL)(t))&&(e.preventDefault(),null==c&&r.indexOf("#")>=0&&(c=!1),n[s?"replace":"push"](t,r,{shallow:a,locale:i,scroll:c}))}(e,s,f,h,v,y,x,m)},onMouseEnter:function(e){(0,o.isLocalURL)(f)&&(n.props&&"function"===typeof n.props.onMouseEnter&&n.props.onMouseEnter(e),u(s,f,h,{priority:!0}))}};if(e.passHref||"a"===n.type&&!("href"in n.props)){var N="undefined"!==typeof m?m:s&&s.locale,k=s&&s.isLocaleDomain&&(0,o.getDomainLocale)(h,N,s&&s.locales,s&&s.domainLocales);E.href=k||(0,o.addBasePath)((0,o.addLocale)(h,N,s&&s.defaultLocale))}return a.default.cloneElement(n,E)};n.default=d},7426:function(e,n,t){"use strict";var r=t(3848);n.__esModule=!0,n.useIntersection=function(e){var n=e.rootMargin,t=e.disabled||!o,i=(0,s.useRef)(),l=(0,s.useState)(!1),u=r(l,2),d=u[0],f=u[1],h=(0,s.useCallback)((function(e){i.current&&(i.current(),i.current=void 0),t||d||e&&e.tagName&&(i.current=function(e,n,t){var r=function(e){var n=e.rootMargin||"",t=c.get(n);if(t)return t;var r=new Map,s=new IntersectionObserver((function(e){e.forEach((function(e){var n=r.get(e.target),t=e.isIntersecting||e.intersectionRatio>0;n&&t&&n(t)}))}),e);return c.set(n,t={id:n,observer:s,elements:r}),t}(t),s=r.id,a=r.observer,o=r.elements;return o.set(e,n),a.observe(e),function(){o.delete(e),a.unobserve(e),0===o.size&&(a.disconnect(),c.delete(s))}}(e,(function(e){return e&&f(e)}),{rootMargin:n}))}),[t,n,d]);return(0,s.useEffect)((function(){if(!o&&!d){var e=(0,a.requestIdleCallback)((function(){return f(!0)}));return function(){return(0,a.cancelIdleCallback)(e)}}}),[d]),[h,d]};var s=t(7294),a=t(3447),o="undefined"!==typeof IntersectionObserver;var c=new Map},2562:function(e,n,t){"use strict";t.r(n),t.d(n,{__N_SSG:function(){return l}});var r=t(5893),s=t(9008),a=t(1664),o=t(8533),c=t(1791),i=t.n(c),l=!0;n.default=function(e){e.drafts;var n=e.published,t="Hi, I'm Geoff Challen. I love to teach, and I love to code. I teach students to code. And I write code that helps them learn.";return(0,r.jsxs)("div",{className:i().index,children:[(0,r.jsxs)(s.default,{children:[(0,r.jsx)("title",{children:"Geoffrey Challen, Teaching Faculty"}),(0,r.jsx)("meta",{property:"og:title",content:"Geoffrey Challen, Teaching Faculty"},"ogtitle"),(0,r.jsx)("meta",{name:"description",content:t.trim()}),(0,r.jsx)("meta",{property:"og:description",content:t.trim()},"ogdesc")]}),(0,r.jsxs)("div",{className:i().container,children:[(0,r.jsx)("img",{src:"/cartoon-light.png",alt:"Geoffrey Challen",width:88,height:102}),(0,r.jsxs)("nav",{className:"".concat(i().nav," responsive"),children:[(0,r.jsx)("div",{children:(0,r.jsx)(a.default,{href:"/essays",children:"Essays"})}),(0,r.jsx)("div",{children:(0,r.jsx)(a.default,{href:"/about",children:"About"})})]})]}),(0,r.jsxs)("div",{className:"responsive",children:[(0,r.jsx)("h1",{children:"Hi, I'm Geoff"}),(0,r.jsxs)("p",{className:i().h2,children:["I love to teach, and I love to code. ",(0,r.jsx)("br",{}),"I teach students to code. ",(0,r.jsx)("br",{}),"And I write code that helps them learn."]}),(0,r.jsx)("p",{children:"My goal is to teach as many students as possible. I do this by creating interactive learning environments that scale."}),(0,r.jsx)("p",{children:(0,r.jsx)(a.default,{href:"/about",children:"More about me..."})}),(0,r.jsx)("hr",{}),(0,r.jsx)(o.Z,{published:n})]})]})}},5301:function(e,n,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/",function(){return t(2562)}])},1791:function(e){e.exports={index:"styles_index__1KkR-",container:"styles_container__3yd9V",h2:"styles_h2__2Ipsc",nav:"styles_nav__gcAIG"}},1664:function(e,n,t){e.exports=t(2167)}},function(e){e.O(0,[774,888,179],(function(){return n=5301,e(e.s=n);var n}));var n=e.O();_N_E=n}]);