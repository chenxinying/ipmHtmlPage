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
    $scope.login_id = $scope.queryParams.login_id;
    $scope.ischecker = $scope.queryParams.ischecker;
    $scope.ismanager = $scope.queryParams.ismanager;
    delete $scope.queryParams.ipm;
    delete $scope.queryParams.login_id;
    delete $scope.queryParams.ischecker;
    delete $scope.queryParams.ismanager;

    $scope.alert = {};
    $scope.dataToggle = 'modal';

    $scope.filelist = [];
    $scope.start = 0;
    $scope.count = 20;
    $scope.keyword;

    //-1. 答疑文件和底图依据 -2. 变更跟踪单
    $scope.getTypeName = function(file){
        if(file.file_type == -1)
            return "答疑文件和底图依据";
        else if(file.file_type == -2)
            return "变更跟踪单";
        else
            return file.taskgroup_name + "-" + file.task_name;
    }

    function append(newValue, oldValue, scope) {
        
        $scope.queryParams.start = $scope.start;
        $scope.queryParams.count = $scope.count;
        $scope.queryParams.keyword = $scope.keyword;

        $scope.queryParams.role_id = 2;//审核底图组提交的文件
        
        $http.get(requestHost + "File/file_list", {
            params: $scope.queryParams
        }).then(
            function(response) {
                if (response.data.length == 0)
                    dereg();
                else{
                    for(var i = 0; i < response.data.length; ++i)
                    {
                        if(response.data[i].file_type == -1) continue;
                        else if(response.data[i].file_type == -2){
                            if(!$scope.ismanager) continue;
                        }else{
                            if(!$scope.ischecker) contine;
                        }
                        $scope.filelist.push(response.data[i]);
                    } 
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


    $scope.auditFile = {};
    $scope.setAuditFile = function(index,file){
        $scope.auditFile.index = index;
        $scope.auditFile.id = file.id;
        $scope.dataToggle = '';
    }

    //审核文件
    $scope.doPassFile = function(){
        auditFile($scope.auditFile.index, $scope.auditFile.id, true, 3);
    }

    //打回文件
    $scope.doBackFile = function(){
        auditFile($scope.auditFile.index, $scope.auditFile.id, false, 2);
    }

    function auditFile(index, file_id, isok, result){
        var postObj = {subproject_id: parseInt($scope.queryParams.subproject_id), openid: $scope.login_id, fileid: file_id, isok: isok};
        $http.post(requestHost + "Auditingfile/Auditingfile", postObj).then(
            function(response) {
                if(response.data.success){
                    $scope.alert.title = "操作成功";
                    $scope.filelist[index].file_state = result;

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

                }else{
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

    //文件状态过滤
    $scope.state_str = ["全部", "待审核", "待修改", "已审核"];
    $scope.selectedStateIndex = 0;
    $scope.showFileState = function(s) {
        $scope.selectedStateIndex = s;
        if (s == 0) {
            delete $scope.queryParams.file_state;
        }else{
            $scope.queryParams.file_state = s;
        }
        $scope.search();
    }

    //提交部门过滤
    $scope.role_str = ["全部","区域经理", "底图组", "总工室总工", "总工室变化层设计组", "总工室施工图组", "检查组", "设计组"];
    $scope.selectedRoleIndex = 0;
    $scope.showFileRole = function(s) {
        $scope.selectedRoleIndex = s;
        if (s == 0) {
            delete $scope.queryParams.role_id;
        }else{
            $scope.queryParams.role_id = s;
        }
        $scope.search();
    }


    //文件类型过滤
    $scope.file_type_str = [{"file_type":0,"filetype_name":"全部"}];
    $scope.selectedFileType = "全部";

    $http.get(requestHost + "File/filetypelist", {
        params: {subproject_id: $location.search().subproject_id}
    }).then(
        function(response) {
            for(var i = 0; i < response.data.length; ++i){
                if(response.data[i].file_type == -1) continue;
                $scope.file_type_str.push(response.data[i]);
            }
        },
        function(response){
            console.log(response);
        }
    );

    $scope.showFileType = function(s) {
        $scope.selectedFileType = $scope.file_type_str[s].filetype_name;
        if (s == 0) {
            delete $scope.queryParams.file_type;
        }else{
            $scope.queryParams.file_type = $scope.file_type_str[s].file_type;
        }
        $scope.search();
    }
}]);
