$(function() {
    $('#lifestream-logo-wrapper p input').on('change', function() {
        if ($(this).prop('checked')) {
            $('#lifestream-logo-wrapper p a.' + $(this).attr('name')).css('opacity', '1');
        } else {
            $('#lifestream-logo-wrapper p a.' + $(this).attr('name')).css('opacity', '.5');
        }
    });


});