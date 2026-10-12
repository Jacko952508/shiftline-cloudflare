// Cancel browser double-click zoom without consuming taps or pointer events.
document.addEventListener('dblclick',event=>event.preventDefault(),{capture:true,passive:false});
