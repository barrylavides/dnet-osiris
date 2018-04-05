//This is for the sidebar
jQuery(document).ready(function($){

  $( ".bookmarks a" ).click(function(event) {
      event.preventDefault();
  });
  $( ".snapshot a" ).click(function(event) {
      event.preventDefault();

  });
  $( ".history a" ).click(function(event) {
      event.preventDefault();
      $(".web-ui").addClass("default-widget-active");
      $('body').css('overflow','hidden');
  });

});
