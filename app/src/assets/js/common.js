$(function() {
    
    $('#deleteModal').on('hide.bs.modal', function(e) {
        var appElement = $("[ng-controller='userCtrl']");
        var $scope = angular.element(appElement).scope();
        $scope.dataToggle = 'modal';
        $scope.$apply();
    });

    $(window).scroll(function() {
        if (Math.ceil($(this).scrollTop()) + Math.ceil($(this).height()) + 1 >= Math.ceil($(document).height())) {
        var appElement = $("[ng-controller='userCtrl']");
        var $scope = angular.element(appElement).scope();
        $scope.start += $scope.count;
        $scope.$apply();
        }
    });
    
});

var requestHost = "/design_institute/public/home/";
