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
    $scope.from_ipm = $location.search().ipm;
    
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

    if(!$scope.queryParams.creator_id){
        alert("喂，创建人id呢？");
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

    //获取负责人列表
    $scope.problemChangerList = [];
    $scope.changer_name = "全部";
    $http.get(requestProblem + "problemuser_list", {
        params: {company_id : $scope.queryParams.company_id, subproject_id: $scope.queryParams.subproject_id}
    }).then(
        function(response) {
            Array.prototype.push.apply($scope.problemChangerList, response.data.changer);
        },
        function(response){
            console.log(response);
        }
    );

    //获取审核人的名称
    $http.get("/design_institute/public/admin/user/selectUser", {
        params: {openid: $scope.queryParams.creator_id}
    }).then(
        function(response) {
            $scope.showCreatorName = response.data.nickname;
        },
        function(response){
            console.log(response);
        }
    );


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

    $scope.exportExcel = function() {
        var params =  angular.copy($scope.queryParams);
        delete params.start;
        delete params.count;
        delete params.keyword;
        var param = "";
        for (var key in params) {
            if(params[key] != undefined)
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

    $scope.newState = '';
    $scope.newTypeId = 0;
    $scope.newGrade = '';
    $scope.newArea = 0;
    $scope.newDescription = '';

    $scope.setDetailUser = function(index, user) {
        $scope.detailUser = angular.copy(user);
        $scope.detailIndex = index;
        $scope.newState = $scope.detailUser.prjState;
        $scope.newTypeId = $scope.detailUser.subtype_id;
        $scope.newGrade = $scope.detailUser.problemGrade;
        $scope.newArea =  $scope.detailUser.errorArea;
        $scope.newDescription = $scope.detailUser.description;
    }

    //设置删除问题
    $scope.deleteData = {};

    $scope.setDeleteUser = function(index, user) {
        $scope.deleteData.index = index;
        $scope.deleteData.openid = user.creator_id;
        $scope.deleteData.problemid = user.id;
        $scope.dataToggle = '';
    };

    //删除问题
    $scope.delete = function() {
        var obj = {openid: $scope.deleteData.openid, problem_id: $scope.deleteData.problemid};
        $http.get(requestProblem + "deleteProblem", {
            params: obj
        }).then(
            function (response) {
                if(response.data.success){
                    $scope.alert.title = "操作成功";
                    $scope.users.splice($scope.deleteData.index, 1);
                }else{
                    $scope.alert.title = "操作失败";
                }
                $scope.alert.content = response.data.message;
                $('#alertModal').modal('show');
            },
            function (response) {
                $scope.alert.title = "操作失败";
                $scope.alert.content = response.toString();
                $('#alertModal').modal('show');
            }
        );
    };

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
    $scope.subtype_str = ["全部", "楼板", "梁板", "墙板", "吊模", "楼梯", "背楞", "其他"];
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

    $scope.auditFile = {};
    $scope.setAuditFile = function(index,file){
        $scope.auditFile.index = index;
        $scope.auditFile.id = file.id;
        $scope.auditFile.openid = file.changer_id;
        $scope.dataToggle = '';
    }

    //通过问题
    $scope.doPassFile = function(){
        auditFile(3);
        $scope.dataToggle = 'modal';
    }

    //打回问题
    $scope.doBackFile = function(){
        auditFile(1);
        $scope.dataToggle = 'modal';
    }

    function auditFile(state){
        var obj = {openid: $scope.auditFile.openid, state: state, problemid:  $scope.auditFile.id};
        $http.post(requestProblem + "Solveproblem", obj).then(
            function(response) {
                if(response.data.success){
                    $scope.alert.title = "操作成功";
                    $scope.users[$scope.auditFile.index].state = state;
                    $scope.users[$scope.auditFile.index].update_time = response.data.update_time;
                    $scope.users[$scope.auditFile.index].state_name = state_str[response.data.state];
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

    //问题阶段
    $scope.detailSelectState = function(index){
        $scope.newState = index;
    }

    //问题部位
    $scope.detailSelectType = function(index){
        $scope.newTypeId = index;
    }

    //问题等级
    $scope.detailSelectGrade = function(index){
        $scope.newGrade = $scope.problemGrade_str[index];
    }

    //执行修改
    $scope.updateObj = {};

    $scope.update = function() {
        
        $scope.updateObj = {problem_id: $scope.detailUser.id};
        
        if($scope.newState != $scope.detailUser.prjState)
            $scope.updateObj.prjState = $scope.newState;
        
        if($scope.newTypeId != $scope.detailUser.subtype_id)
            $scope.updateObj.subtype_id = $scope.newTypeId;

        if($scope.newGrade != $scope.detailUser.problemGrade)
            $scope.updateObj.problemGrade = $scope.newGrade;

        if($scope.newArea != $scope.detailUser.errorArea)
            $scope.updateObj.errorArea = $scope.newArea;
        
        if($scope.newDescription != $scope.detailUser.description)
            $scope.updateObj.description = $scope.newDescription;

        $http.post("/design_institute/public/admin/Problem/EditProblem", $scope.updateObj).then(
            
            function(response) {
                if(response.data.success){
                    $scope.alert.title = "操作成功";
                    
                    if($scope.newState != $scope.detailUser.prjState)
                        $scope.users[$scope.detailIndex].prjState = $scope.newState;

                    if($scope.newTypeId != $scope.detailUser.subtype_id)
                    {
                        $scope.users[$scope.detailIndex].subtype_id = $scope.newTypeId;
                        $scope.users[$scope.detailIndex].subtype_name = $scope.subtype_str[$scope.users[$scope.detailIndex].subtype_id];
                    }
                    
                    if($scope.newGrade != $scope.detailUser.problemGrade)
                        $scope.users[$scope.detailIndex].problemGrade = $scope.newGrade;

                    if($scope.newArea != $scope.detailUser.errorArea)
                        $scope.users[$scope.detailIndex].errorArea = $scope.newArea;
                    
                    if($scope.newDescription != $scope.detailUser.description)    
                        $scope.users[$scope.detailIndex].description = $scope.newDescription;
                    
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
        
    };
}]);
