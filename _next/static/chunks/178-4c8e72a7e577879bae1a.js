(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[178],{9428:function(t,e,o){"use strict";o.d(e,{X:function(){return s}});var i=o(7294);const n=({color:t="currentColor",direction:e="left",distance:o="md",duration:n=.4,easing:r="cubic-bezier(0, 0, 0, 1)",hideOutline:s=!0,label:a,lines:l=3,onToggle:h,render:c,rounded:u=!1,size:d=32,toggle:p,toggled:f})=>{const[b,v]=(0,i.useState)(!1),g=Math.max(12,Math.min(48,d)),m=Math.round((48-g)/2),y=g/12,S=Math.round(y),T=g/(l*(("lg"===o?.25:"sm"===o?.75:.5)+(3===l?1:1.25))),C=Math.round(T),X=S*l+C*(l-1),w=Math.round((48-X)/2),W=parseFloat((g/(3===l?"lg"===o?4.0425:"sm"===o?5.1625:4.6325:"lg"===o?6.7875:"sm"===o?8.4875:7.6675)-(y-S+(T-C))/(3===l?1:2)/(4/3)).toFixed(2)),k=Math.max(0,n),x={cursor:"pointer",height:"48px",position:"relative",transition:`${k}s ${r}`,userSelect:"none",width:"48px"},E={background:t,height:`${S}px`,left:`${m}px`,position:"absolute"};s&&(x.outline="none"),u&&(E.borderRadius="9em");const M=p||v,O=void 0!==f?f:b;return c({barHeight:S,barStyles:E,burgerStyles:x,easing:r,handler:()=>{M(!O),"function"===typeof h&&h(!O)},isLeft:"left"===e,isToggled:O,label:a,margin:C,move:W,time:k,topOffset:w,width:g})};function r(){return(r=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var o=arguments[e];for(var i in o)Object.prototype.hasOwnProperty.call(o,i)&&(t[i]=o[i])}return t}).apply(this,arguments)}const s=t=>i.createElement(n,r({},t,{lines:2,render:t=>i.createElement("div",{className:"hamburger-react","aria-label":t.label,onClick:t.handler,onKeyUp:e=>"Enter"===e.key&&t.handler(),role:"button",style:t.burgerStyles,tabIndex:0},i.createElement("div",{style:{...t.barStyles,width:`${t.width}px`,top:`${t.topOffset}px`,transition:`${t.time}s ${t.easing}`,transform:""+(t.isToggled?`rotate(${45*(t.isLeft?-1:1)}deg) translate(${t.move*(t.isLeft?-1:1)}px, ${t.move}px)`:"none")}}),i.createElement("div",{style:{...t.barStyles,width:`${t.width}px`,top:`${t.topOffset+t.barHeight+t.margin}px`,transition:`${t.time}s ${t.easing}`,transform:""+(t.isToggled?`rotate(${45*(t.isLeft?1:-1)}deg) translate(${t.move*(t.isLeft?-1:1)}px, ${-1*t.move}px)`:"none")}}))}))},2167:function(t,e,o){"use strict";var i=o(3848),n=o(9448);e.default=void 0;var r=n(o(7294)),s=o(9414),a=o(4651),l=o(7426),h={};function c(t,e,o,i){if(t&&(0,s.isLocalURL)(e)){t.prefetch(e,o,i).catch((function(t){0}));var n=i&&"undefined"!==typeof i.locale?i.locale:t&&t.locale;h[e+"%"+o+(n?"%"+n:"")]=!0}}var u=function(t){var e,o=!1!==t.prefetch,n=(0,a.useRouter)(),u=r.default.useMemo((function(){var e=(0,s.resolveHref)(n,t.href,!0),o=i(e,2),r=o[0],a=o[1];return{href:r,as:t.as?(0,s.resolveHref)(n,t.as):a||r}}),[n,t.href,t.as]),d=u.href,p=u.as,f=t.children,b=t.replace,v=t.shallow,g=t.scroll,m=t.locale;"string"===typeof f&&(f=r.default.createElement("a",null,f));var y=(e=r.Children.only(f))&&"object"===typeof e&&e.ref,S=(0,l.useIntersection)({rootMargin:"200px"}),T=i(S,2),C=T[0],X=T[1],w=r.default.useCallback((function(t){C(t),y&&("function"===typeof y?y(t):"object"===typeof y&&(y.current=t))}),[y,C]);(0,r.useEffect)((function(){var t=X&&o&&(0,s.isLocalURL)(d),e="undefined"!==typeof m?m:n&&n.locale,i=h[d+"%"+p+(e?"%"+e:"")];t&&!i&&c(n,d,p,{locale:e})}),[p,d,X,m,o,n]);var W={ref:w,onClick:function(t){e.props&&"function"===typeof e.props.onClick&&e.props.onClick(t),t.defaultPrevented||function(t,e,o,i,n,r,a,l){("A"!==t.currentTarget.nodeName||!function(t){var e=t.currentTarget.target;return e&&"_self"!==e||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||t.nativeEvent&&2===t.nativeEvent.which}(t)&&(0,s.isLocalURL)(o))&&(t.preventDefault(),null==a&&i.indexOf("#")>=0&&(a=!1),e[n?"replace":"push"](o,i,{shallow:r,locale:l,scroll:a}))}(t,n,d,p,b,v,g,m)},onMouseEnter:function(t){(0,s.isLocalURL)(d)&&(e.props&&"function"===typeof e.props.onMouseEnter&&e.props.onMouseEnter(t),c(n,d,p,{priority:!0}))}};if(t.passHref||"a"===e.type&&!("href"in e.props)){var k="undefined"!==typeof m?m:n&&n.locale,x=n&&n.isLocaleDomain&&(0,s.getDomainLocale)(p,k,n&&n.locales,n&&n.domainLocales);W.href=x||(0,s.addBasePath)((0,s.addLocale)(p,k,n&&n.defaultLocale))}return r.default.cloneElement(e,W)};e.default=u},7426:function(t,e,o){"use strict";var i=o(3848);e.__esModule=!0,e.useIntersection=function(t){var e=t.rootMargin,o=t.disabled||!s,l=(0,n.useRef)(),h=(0,n.useState)(!1),c=i(h,2),u=c[0],d=c[1],p=(0,n.useCallback)((function(t){l.current&&(l.current(),l.current=void 0),o||u||t&&t.tagName&&(l.current=function(t,e,o){var i=function(t){var e=t.rootMargin||"",o=a.get(e);if(o)return o;var i=new Map,n=new IntersectionObserver((function(t){t.forEach((function(t){var e=i.get(t.target),o=t.isIntersecting||t.intersectionRatio>0;e&&o&&e(o)}))}),t);return a.set(e,o={id:e,observer:n,elements:i}),o}(o),n=i.id,r=i.observer,s=i.elements;return s.set(t,e),r.observe(t),function(){s.delete(t),r.unobserve(t),0===s.size&&(r.disconnect(),a.delete(n))}}(t,(function(t){return t&&d(t)}),{rootMargin:e}))}),[o,e,u]);return(0,n.useEffect)((function(){if(!s&&!u){var t=(0,r.requestIdleCallback)((function(){return d(!0)}));return function(){return(0,r.cancelIdleCallback)(t)}}}),[u]),[p,u]};var n=o(7294),r=o(3447),s="undefined"!==typeof IntersectionObserver;var a=new Map},1664:function(t,e,o){t.exports=o(2167)},8590:function(t,e,o){"use strict";function i(t,e,o){return e in t?Object.defineProperty(t,e,{value:o,enumerable:!0,configurable:!0,writable:!0}):t[e]=o,t}function n(t){for(var e=1;e<arguments.length;e++){var o=null!=arguments[e]?Object(arguments[e]):{},n=Object.keys(o);"function"===typeof Object.getOwnPropertySymbols&&(n=n.concat(Object.getOwnPropertySymbols(o).filter((function(t){return Object.getOwnPropertyDescriptor(o,t).enumerable})))),n.forEach((function(e){i(t,e,o[e])}))}return t}function r(t,e){return(r=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t})(t,e)}function s(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}o.d(e,{Z:function(){return f}});var a=o(7294),l=(o(5697),{position:"absolute",top:0,left:0,right:0,bottom:0,overflow:"hidden"}),h={zIndex:2,position:"absolute",top:0,bottom:0,transition:"transform .3s ease-out",WebkitTransition:"-webkit-transform .3s ease-out",willChange:"transform",overflowY:"auto"},c={position:"absolute",top:0,left:0,right:0,bottom:0,overflowY:"auto",WebkitOverflowScrolling:"touch",transition:"left .3s ease-out, right .3s ease-out"},u={zIndex:1,position:"fixed",top:0,left:0,right:0,bottom:0,opacity:0,visibility:"hidden",transition:"opacity .3s ease-out, visibility .3s ease-out",backgroundColor:"rgba(0,0,0,.3)"},d={zIndex:1,position:"fixed",top:0,bottom:0},p=function(t){var e,o;function i(e){var o;return(o=t.call(this,e)||this).state={sidebarWidth:e.defaultSidebarWidth,touchIdentifier:null,touchStartX:null,touchCurrentX:null,dragSupported:!1},o.overlayClicked=o.overlayClicked.bind(s(s(o))),o.onTouchStart=o.onTouchStart.bind(s(s(o))),o.onTouchMove=o.onTouchMove.bind(s(s(o))),o.onTouchEnd=o.onTouchEnd.bind(s(s(o))),o.onScroll=o.onScroll.bind(s(s(o))),o.saveSidebarRef=o.saveSidebarRef.bind(s(s(o))),o}o=t,(e=i).prototype=Object.create(o.prototype),e.prototype.constructor=e,r(e,o);var p=i.prototype;return p.componentDidMount=function(){var t=/iPad|iPhone|iPod/.test(navigator?navigator.userAgent:"");this.setState({dragSupported:"object"===typeof window&&"ontouchstart"in window&&!t}),this.saveSidebarWidth()},p.componentDidUpdate=function(){this.isTouching()||this.saveSidebarWidth()},p.onTouchStart=function(t){if(!this.isTouching()){var e=t.targetTouches[0];this.setState({touchIdentifier:e.identifier,touchStartX:e.clientX,touchCurrentX:e.clientX})}},p.onTouchMove=function(t){if(this.isTouching())for(var e=0;e<t.targetTouches.length;e++)if(t.targetTouches[e].identifier===this.state.touchIdentifier){this.setState({touchCurrentX:t.targetTouches[e].clientX});break}},p.onTouchEnd=function(){if(this.isTouching()){var t=this.touchSidebarWidth();(this.props.open&&t<this.state.sidebarWidth-this.props.dragToggleDistance||!this.props.open&&t>this.props.dragToggleDistance)&&this.props.onSetOpen(!this.props.open),this.setState({touchIdentifier:null,touchStartX:null,touchCurrentX:null})}},p.onScroll=function(){this.isTouching()&&this.inCancelDistanceOnScroll()&&this.setState({touchIdentifier:null,touchStartX:null,touchCurrentX:null})},p.inCancelDistanceOnScroll=function(){return this.props.pullRight?Math.abs(this.state.touchCurrentX-this.state.touchStartX)<20:Math.abs(this.state.touchStartX-this.state.touchCurrentX)<20},p.isTouching=function(){return null!==this.state.touchIdentifier},p.overlayClicked=function(){this.props.open&&this.props.onSetOpen(!1)},p.saveSidebarWidth=function(){var t=this.sidebar.offsetWidth;t!==this.state.sidebarWidth&&this.setState({sidebarWidth:t})},p.saveSidebarRef=function(t){this.sidebar=t},p.touchSidebarWidth=function(){return this.props.pullRight?this.props.open&&window.innerWidth-this.state.touchStartX<this.state.sidebarWidth?this.state.touchCurrentX>this.state.touchStartX?this.state.sidebarWidth+this.state.touchStartX-this.state.touchCurrentX:this.state.sidebarWidth:Math.min(window.innerWidth-this.state.touchCurrentX,this.state.sidebarWidth):this.props.open&&this.state.touchStartX<this.state.sidebarWidth?this.state.touchCurrentX>this.state.touchStartX?this.state.sidebarWidth:this.state.sidebarWidth-this.state.touchStartX+this.state.touchCurrentX:Math.min(this.state.touchCurrentX,this.state.sidebarWidth)},p.render=function(){var t,e=n({},h,this.props.styles.sidebar),o=n({},c,this.props.styles.content),i=n({},u,this.props.styles.overlay),r=this.state.dragSupported&&this.props.touch,s=this.isTouching(),p={className:this.props.rootClassName,style:n({},l,this.props.styles.root),role:"navigation",id:this.props.rootId},f=this.props.shadow&&(s||this.props.open||this.props.docked);if(this.props.pullRight?(e.right=0,e.transform="translateX(100%)",e.WebkitTransform="translateX(100%)",f&&(e.boxShadow="-2px 2px 4px rgba(0, 0, 0, 0.15)")):(e.left=0,e.transform="translateX(-100%)",e.WebkitTransform="translateX(-100%)",f&&(e.boxShadow="2px 2px 4px rgba(0, 0, 0, 0.15)")),s){var b=this.touchSidebarWidth()/this.state.sidebarWidth;this.props.pullRight?(e.transform="translateX("+100*(1-b)+"%)",e.WebkitTransform="translateX("+100*(1-b)+"%)"):(e.transform="translateX(-"+100*(1-b)+"%)",e.WebkitTransform="translateX(-"+100*(1-b)+"%)"),i.opacity=b,i.visibility="visible"}else this.props.docked?(0!==this.state.sidebarWidth&&(e.transform="translateX(0%)",e.WebkitTransform="translateX(0%)"),this.props.pullRight?o.right=this.state.sidebarWidth+"px":o.left=this.state.sidebarWidth+"px"):this.props.open&&(e.transform="translateX(0%)",e.WebkitTransform="translateX(0%)",i.opacity=1,i.visibility="visible");if(!s&&this.props.transitions||(e.transition="none",e.WebkitTransition="none",o.transition="none",i.transition="none"),r)if(this.props.open)p.onTouchStart=this.onTouchStart,p.onTouchMove=this.onTouchMove,p.onTouchEnd=this.onTouchEnd,p.onTouchCancel=this.onTouchEnd,p.onScroll=this.onScroll;else{var v=n({},d,this.props.styles.dragHandle);v.width=this.props.touchHandleWidth,this.props.pullRight?v.right=0:v.left=0,t=a.createElement("div",{style:v,onTouchStart:this.onTouchStart,onTouchMove:this.onTouchMove,onTouchEnd:this.onTouchEnd,onTouchCancel:this.onTouchEnd})}return a.createElement("div",p,a.createElement("div",{className:this.props.sidebarClassName,style:e,ref:this.saveSidebarRef,id:this.props.sidebarId},this.props.sidebar),a.createElement("div",{className:this.props.overlayClassName,style:i,onClick:this.overlayClicked,id:this.props.overlayId}),a.createElement("div",{className:this.props.contentClassName,style:o,id:this.props.contentId},t,this.props.children))},i}(a.Component);p.defaultProps={docked:!1,open:!1,transitions:!0,touch:!0,touchHandleWidth:20,pullRight:!1,shadow:!0,dragToggleDistance:30,onSetOpen:function(){},styles:{},defaultSidebarWidth:0};var f=p}}]);