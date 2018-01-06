var app = angular.module('myApp', []);

var requestProblem = requestHost + "Problem/";
var requestProject = requestHost + "Project/";

app.config(['$locationProvider', function ($locationProvider) {
            $locationProvider.html5Mode({
                enabled: true,
                requireBase: false
            });
    }]);

app.controller('userCtrl', ['$scope', '$http', '$location', function($scope, $http, $location) {

    if(!$location.search().company_id){
        alert("喂，你是哪个公司的？");
        return;
    }

    $scope.queryParams = {};
    $scope.queryParams.company_id = $location.search().company_id;
    $scope.queryParams.project_id = $location.search().project_id;
    $scope.queryParams.subproject_id = $location.search().subproject_id;
    $scope.from_ipm = $location.search().ipm;

    $scope.projectList = [{id:0, name:"全部"}];
    $scope.showProjectName = "全部";

    //获取所有的总项目列表
    $http.get(requestProject + "projectInfo_list", {
        params: {company_id: $scope.queryParams.company_id}
    }).then(
        function (response) {
            Array.prototype.push.apply($scope.projectList, response.data);
        },
        function (response) {
            console.log(response);
        }
    );

    function initSubProjectList(){

        $scope.subprojectList = [{id:0, name:"全部"}];
        $scope.showSubprojectName = "全部";

        if($scope.queryParams.project_id){
            //获取总项目id的名称
            $http.get(requestProject + "project_name", {
                params: {project_id: $scope.queryParams.project_id}
            }).then(
                function (response) {
                    if(response.data.length == 0){
                        alert("总项目不存在！");
                        return;
                    }
                    $scope.showProjectName = response.data[0].name;
                },
                function errorCallback(response) {
                    console.log(response);
                }
            );
    
            //获取所有的子项目列表
            $http.get(requestProject + "subprojectInfo_list", {
                params: {project_id: $scope.queryParams.project_id}
            }).then(
                function (response) {
                    Array.prototype.push.apply($scope.subprojectList, response.data);
                    if($scope.queryParams.subproject_id){
                        for(var i = 0; i < response.data.length; ++i){
                            if(response.data[i].id == $scope.queryParams.subproject_id){
                                $scope.showSubprojectName = response.data[i].name;
                                return;
                            }
                        }
                    }
                },
                function (response) {
                    console.log(response);
                }
            );
        }
    }

    $scope.selectProject = function(project){
        if(project.id == 0){
            delete $scope.queryParams.project_id;
            delete $scope.queryParams.subproject_id;
        }else{
            $scope.queryParams.project_id = project.id;
        }
        $scope.showProjectName = project.name;
        $scope.search();
    }

    $scope.selectSubproject = function(subproject){
        if(subproject.id == 0){
            delete $scope.queryParams.subproject_id;
        }else{
            $scope.queryParams.subproject_id = subproject.id;
        }
        $scope.showSubprojectName = subproject.name;
        $scope.search();
    }

    var deregInit = $scope.$watch('queryParams.project_id', initSubProjectList);

    $scope.problemChangerList = [];
    $scope.problemCreatorList = [];

    //负责人没有传入
    $scope.changer_id =  $scope.queryParams.changer_id;
    $scope.changer_name = $scope.queryParams.changer_name;
    delete $scope.queryParams.changer_name;

    if($scope.queryParams.changer_id == undefined)
    {
        $scope.changer_name = "全部";
        $http.get(requestProblem + "problemuser_list", {
            params: {company_id: $scope.queryParams.company_id}
        }).then(
            function (response) {
                Array.prototype.push.apply($scope.problemChangerList, response.data.changer);
            },
            function (response) {
                console.log(response);
            }
        );
    }

    //审核没有传入
    $scope.creator_id = $scope.queryParams.creator_id;
    $scope.creator_name = $scope.queryParams.creator_name;
    delete $scope.queryParams.creator_name;

    if($scope.queryParams.creator_id == undefined)
    {
        $scope.creator_name = "全部";
        $http.get(requestProblem + "problemuser_list", {
            params: {company_id: $scope.queryParams.company_id}
        }).then(
            function (response) {
                Array.prototype.push.apply($scope.problemCreatorList, response.data.creator);
            },
            function (response) {
                console.log(response);
            }
        );
    }

     //负责人过滤
     $scope.showChanger = function(s){
        if(s == 0){
            $scope.changer_name = "全部";
            delete $scope.queryParams.changer_id;
        }else{
            $scope.queryParams.changer_id = s.changer_id;
            $scope.changer_name = s.changer_nickname;
        }
        $scope.search();
    }

    //审核人过滤
    $scope.showCreator = function(s){
        if(s == 0){
            $scope.creator_name = "全部";
            delete $scope.queryParams.creator_id;
        }else{
            $scope.queryParams.creator_id = s.creator_id;
            $scope.creator_name = s.creator_nickname;
        }
        $scope.search();
    }
    
    $scope.alert = {}
    $scope.dataToggle = 'modal';

    $scope.users = [];
    $scope.start = 0;
    $scope.count = 20;
    $scope.keyword;

    function append(newValue, oldValue, scope) {
        
        $scope.queryParams.start = $scope.start;
        $scope.queryParams.count = $scope.count;
        $scope.queryParams.keyword = $scope.keyword;

        $http.get(requestProblem + "ProblemInfo_list", {
            params: $scope.queryParams
        }).then(
            function (response) {
                if (response.data.length == 0)
                    dereg();
                else
                    Array.prototype.push.apply($scope.users, response.data);
            },
            function (response) {
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
        $scope.users = [];
        dereg = $scope.$watch('start', append);
    }

    $scope.exportExcel = function() {
        var params =  angular.copy($scope.queryParams);
        delete params.start;
        delete params.count;
        delete params.keyword;
        var param = "";
        for (var key in params) {
            param += key + "=" + params[key] + "&";
        }
        if (param !="")
        {
            param = "?" + param;
            param = param.substring(0,param.length-1)
        }
        execAsync(JSON.stringify({
            functionName: 'ExpoerExcel',
            functionParams: { args: {url:"http://120.25.74.178" + requestProblem + "ProblemInfo_list" + param}},
            invokeAsCommand: false
        }),
        function(result){console.log(result)},
        function(result){console.log(result)});
    }
    
    //详细信息
    $scope.detailUser = {};
    $scope.detailIndex;

    $scope.setDetailUser = function(index, user) {
        $scope.detailUser = angular.copy(user);
        $scope.detailIndex = index;
    }

    //问题状态过滤
    var state_str = ["全部", "待解决", "待审核", "已解决"];
    $scope.selectedState = "全部";

    $scope.showProblemState = function(s) {
        
        $scope.selectedState = state_str[s];

        if (s == 0) {
            delete $scope.queryParams.state;
        }else{
            $scope.queryParams.state = s;
        }
        $scope.search();
    }

    //问题阶段过滤
    $scope.prjState_str = ["全部", "底图深化", "配模阶段", "制图阶段", "预拼装", "现场施工"];
    $scope.selectedPrjState = "全部";
    $scope.showProblemPrjState = function(s) {

        $scope.selectedPrjState = $scope.prjState_str[s];

        if (s == 0) {
            delete $scope.queryParams.prjState;
        }else{
            $scope.queryParams.prjState = s;
        }
        $scope.search();
    }

    //问题部位过滤
    $scope.subtype_str = ["全部", "楼板", "梁板", "墙板", "飘台", "楼梯", "背楞", "其他"];
    $scope.selectedSubtype = "全部";

    $scope.showProblemType = function(s){

        $scope.selectedSubtype =  $scope.subtype_str[s];

        if (s == 0) {
            delete $scope.queryParams.subtype_id;
        }else{
            $scope.queryParams.subtype_id = s;
        }

        $scope.search();
    }

    //问题登记过滤
    $scope.problemGrade_str = ["全部", "一级", "二级", "三级", "四级", "五级"];
    $scope.selectedProblemGrade = "全部";
    $scope.showProblemGrade = function(s){
        $scope.selectedProblemGrade = $scope.problemGrade_str[s];
        if (s == 0) {
            delete $scope.queryParams.problemGrade;
        }else{
            $scope.queryParams.problemGrade = $scope.problemGrade_str[s];
        }
       $scope.search();
    }
    
    $scope.showImg = function(img){
        //调用arx函数
        execAsync(JSON.stringify({
            functionName: 'ShowImage',
            functionParams: { args: {url:img}},
            invokeAsCommand: false
        }),
        function(result){console.log(result)},
        function(result){console.log(result)});
    }
    
}]);
