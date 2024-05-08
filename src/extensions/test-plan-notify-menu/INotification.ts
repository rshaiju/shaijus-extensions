export interface INotificationModel{
    projectName: string
    testPlanId: number,
    testSuiteId: number,
    testCaseId: string,
    testCaseName: string
    testConfigurationId: string,
    testConfigurationName: string,
    assignee: string,
    assigneeDisplayName: string
}