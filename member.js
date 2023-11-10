function skillsMember(){
    return {
        restrict: 'E',
        templateUrl: 'models/skills-member.html',
        controller: 'skillsMemberController',
        controllerAs: 'vm',
        bindToController: true,
        scope: {
            member: '='
        }
    };
}