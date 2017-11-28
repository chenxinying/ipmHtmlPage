var app = angular.module('myApp', []);

app.config(['$locationProvider', function ($locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
}]);

function OnArxSuccess(result)
{
    console.log(result);
}

function OnArxError(result)
{
    console.log(result);
}

app.controller('userCtrl', ['$scope', '$http', '$location', function($scope, $http, $location) {
 
    $scope.queryParams =  angular.copy($location.search());
    
    $scope.from_ipm = $scope.queryParams.ipm;
    delete $scope.queryParams.ipm;

    $scope.alert = {};
    $scope.dataToggle = 'modal';

    $scope.filelist = [];
    $scope.start = 0;
    $scope.count = 20;
    $scope.keyword;

    function append(newValue, oldValue, scope) {
        
        $scope.queryParams.start = $scope.start;
        $scope.queryParams.count = $scope.count;
        $scope.queryParams.keyword = $scope.keyword;

        $http.get(requestHost + "File/tempfile_list", {
            params: $scope.queryParams
        }).then(
            function(response) {
                if (response.data.length == 0)
                    dereg();
                else{ 
                    Array.prototype.push.apply($scope.filelist, response.data);
                }
            },
            function(response){
                console.log(response);
            }
        );
    }

    //滚动到底加载数据
    var dereg = $scope.$watch('start', append);
    
    //搜索
    $scope.search = function() {
        dereg();
        $scope.start = 0;
        $scope.filelist = [];
        dereg = $scope.$watch('start', append);
    }

    //下载
    $scope.download = function(file){
        var file_name = encodeURI(file.file_name);
        var url = file.download_url;
        var role_id = file.role_id;
        var file_state = file.file_state;

        //调用arx函数
        execAsync(JSON.stringify({
            functionName: 'DownloadFile',
            functionParams: { args: {file_name:file_name, url:url, role_id:role_id, file_state:file_state}},
            invokeAsCommand: false
        }),
        OnArxSuccess,
        OnArxError);
    }

    $scope.deleteData = {};
    $scope.setDeleteFile = function(index, file) {
        $scope.deleteData.index = index;
        $scope.deleteData.id = file.id;
        $scope.dataToggle = '';
    };

    //删除文件
    $scope.delete = function(){
        var postObj = {subproject_id: parseInt($scope.queryParams.subproject_id), openid: $scope.queryParams.login_id, fileid: $scope.deleteData.id};
        $http.post(requestHost + "Deletefile/deletetempfile", postObj).then(
            function(response) {
                if(response.data.success)
                {
                    $scope.alert.title = "操作成功";
                    $scope.filelist.splice($scope.deleteData.index, 1);

                    if($scope.from_ipm)
                    {
                        //调用arx函数
                        execAsync(JSON.stringify({
                            functionName: 'AfterAuditFile',
                            functionParams: { args: {state: response.data.state}},
                            invokeAsCommand: false
                        }),
                        OnArxSuccess,
                        OnArxError);
                    }
                    
                }else
                {
                    $scope.alert.title = "操作失败";
                }
                $scope.alert.content = response.data.message;
                $('#alertModal').modal('show');
            },
            function(e) {
                $scope.alert.title = "操作失败";
                $scope.alert.content = e.toString();
                $('#alertModal').modal('show');
            }
        );
    }
}]);
