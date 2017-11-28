var app = angular.module('myApp', []);

var requestProblem = requestHost + "Problem/";
var requestProject = requestHost + "Project/";

app.config(['$locationProvider', function ($locationProvider) {
            $locationProvider.html5Mode({
                enabled: true,
                requireBase: false//必须配置为false，否则<base href=''>这种格式带base链接的地址才能解析
            });
    }]);

app.controller('userCtrl', ['$scope', '$http', '$location', function($scope, $http, $location) {

    $scope.queryParams =  angular.copy($location.search());
    
    if(!$scope.queryParams.company_id){
        alert("喂，你是哪个公司的？");
        return;
    }

    if(!$scope.queryParams.project_id){
        alert("喂，总项目id呢？");
        return;
    }

    if(!$scope.queryParams.subproject_id){
        alert("喂，子项目id呢？");
        return;
    }

    if(!$scope.queryParams.changer_id){
        alert("喂，负责人id呢？");
        return;
    }

    //获取总项目的名称
    $http.get(requestProject + "project_name", {
        params: {project_id: $scope.queryParams.project_id}
    }).then(
        function(response) {
            if(response.data.length == 0){
                alert("总项目不存在！");
                return;
            }
            $scope.showProjectName = response.data[0].name;
        },
        function(response){
            console.log(response);
        }
    );

    //获取子项目的名称
    $http.get(requestProject + "subproject_name", {
        params: {subproject_id: $scope.queryParams.subproject_id}
    }).then(
        function(response) {
            if(response.data.length == 0){
                alert("子项目不存在！");
                return;
            }
            $scope.showSubprojectName = response.data[0].name;
        },
        function(response){
            console.log(response);
        }
    );

    //获取审核人列表
    $scope.problemCreatorList = [];
    $scope.creator_name = "全部";
    $http.get(requestProblem + "problemuser_list", {
        params: {subproject_id: $scope.queryParams.subproject_id}
    }).then(
        function(response) {
            Array.prototype.push.apply($scope.problemCreatorList, response.data.creator);
            for(var i = 0; i < response.data.changer.length; ++i){
                if(response.data.changer[i].changer_id == $scope.queryParams.changer_id){
                    $scope.showChangerName = response.data.changer[i].changer_nickname;
                    return;
                }
            }
        },
        function(response){
            console.log(response);
        }
    );


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
            function(response) {
                if (response.data.length == 0)
                    dereg();
                else
                    Array.prototype.push.apply($scope.users, response.data);
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
        $scope.users = [];
        dereg = $scope.$watch('start', append);
    }

    //详细信息
    $scope.detailUser = {};
    $scope.detailIndex;

    $scope.setDetailUser = function(index, user) {
        $scope.detailUser = angular.copy(user);
        $scope.detailIndex = index;
    }

    //设置解决问题
    $scope.deleteData = {};
    $scope.setDeleteUser = function(index, user) {
        $scope.deleteData.index = index;
        $scope.deleteData.openid = user.changer_id;
        $scope.deleteData.problemid = user.id;
        $scope.dataToggle = '';
    };

    //解决问题
    $scope.delete = function() {
        var obj = {openid: $scope.deleteData.openid, state: 3, problemid: $scope.deleteData.problemid};
        $http.post(requestProblem + "Solveproblem", obj).then(
            function(response) {
                if(response.data.success)
                {
                    var state_str = ["全部", "待解决", "", "已解决"];
                    $scope.users[$scope.deleteData.index].state = response.data.state;
                    $scope.users[$scope.deleteData.index].update_time = response.data.update_time;
                    $scope.users[$scope.deleteData.index].state_name = state_str[response.data.state];
                    $scope.alert.title = "操作成功";
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
    };

    //问题状态过滤
    var state_str = ["全部", "待解决", "", "已解决"];
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
}]);
