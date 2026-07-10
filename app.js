const refinement=document.createElement('link');
refinement.rel='stylesheet';
refinement.href='refinement.css';
document.head.appendChild(refinement);
const terminalLinkStyles=document.createElement('link');
terminalLinkStyles.rel='stylesheet';
terminalLinkStyles.href='terminal-link.css';
document.head.appendChild(terminalLinkStyles);
const core=document.createElement('script');
core.src='app-core.js';
core.onload=()=>{
  const protocol=document.createElement('script');
  protocol.src='observer.js';
  document.head.appendChild(protocol);
};
document.head.appendChild(core);
