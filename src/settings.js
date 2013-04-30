$(function() {
    $(".dial").knob({
    	'width': 60,
    	'height': 60,
    	// 'fgColor': "#000",
    	'fgColor':"#FFEC03",
		'bgColor':'#000',
		'displayPrevious': 'true'
    });

    $("#header").mouseenter(function(){
	    $(this).animate({
	        marginTop: "-15px"
	    }, 100);
	}).mouseleave(function(){
	    $(this).animate({
	        marginTop: "-70px"
	    }, 100);
	});

	$("#sidebar").mouseenter(function(){
	    $(this).animate({
	        marginRight: "-15px"
	    }, 100);
	}).mouseleave(function(){
	    $(this).animate({
	        marginRight: "-150px"
	    }, 100);
	});

	$("#nav").mouseenter(function(){
	    $(this).animate({
	        marginLeft: "-15px"
	    }, 100);
	}).mouseleave(function(){
	    $(this).animate({
	        marginLeft: "-305px"
	    }, 100);
	});
});