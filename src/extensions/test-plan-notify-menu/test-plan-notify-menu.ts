import "es6-promise/auto";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, getClient, IHostPageLayoutService, IHostNavigationService } from "azure-devops-extension-api";
import { WorkItemTrackingRestClient} from "azure-devops-extension-api/WorkItemTracking";
import { PointAssignment, SuiteTestCase, TestPoint, TestRestClient } from "azure-devops-extension-api/Test";
import {INotificationModel} from "./INotification";


SDK.register("notify-next-test-case-assignee", () => {
    return {
        execute: async (context: any[]) => {

            const dialogSvc = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);

            const selectedTestPoint:any=context[0];

            if(selectedTestPoint.outcome!='Passed') {
                dialogSvc.openMessageDialog('The given test case should have passed for notifying the next assignee. Exiting!!');
                return;
            }

            const projectName: string=selectedTestPoint["System.TeamProject"];
            const planId=await getPlanIdFromUrl();

            if(planId==null){
                console.log('Error getting plan id!!, Exiting..')
                return;
            }

            const notificationDetails=await getNotificationDetails(projectName,planId,selectedTestPoint);
            
            if(notificationDetails==null)
            {
                console.log('Error getting notification details!!, Exiting..')
                return;
            }

            const workItemPayload= await createNotification(notificationDetails);

            try {
                const witClient=await getClient(WorkItemTrackingRestClient);
                const createdNotification = await witClient.createWorkItem(workItemPayload, projectName, "Notification"); 
                console.log(createdNotification);
                
                dialogSvc.openMessageDialog(`${notificationDetails.assigneeDisplayName} notified to start!!${notificationDetails.testCaseName}`, { showCancel: false });
            } catch (error) {
                console.log("Error in creating Notification:" + error)
            }

        }
    }
});

async function getNotificationDetails(projectName:string, testPlanId:number, selectedTestPoint:any): Promise<INotificationModel|null>
{

    console.log('In: getNotificationDetails');

    const testClient=await getClient(TestRestClient);
    const dialogSvc = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);


    let newTestPointAssignment:PointAssignment;

    if(testClient !=null){

        console.log('Test Client Initialized');

        const testCases:SuiteTestCase[]=await testClient.getTestCases(projectName,testPlanId, selectedTestPoint.suiteId);
        const currentTestCaseIndex= testCases.findIndex(tc=>tc.testCase.id==selectedTestPoint.testCaseId);
        const currentTestCase=testCases[currentTestCaseIndex];
        const currentTestPointIndex= currentTestCase?.pointAssignments.findIndex(tcp=>tcp.configuration.id==selectedTestPoint.configurationId);
        if(currentTestCase==undefined){
            console.log("Error retrieving test case");
            return null;
        }

        console.log('Test Cases Retrieved');

        if(currentTestPointIndex==undefined){
            console.log("Error retrieving test point index");
            return null;
        }

        console.log('Test Point Retrieved');

        if(currentTestPointIndex<currentTestCase.pointAssignments.length-1){
            newTestPointAssignment=currentTestCase.pointAssignments[currentTestPointIndex+1];
            
            if(newTestPointAssignment!=null){
                return {
                    projectName: projectName,
                    testPlanId: testPlanId,
                    testSuiteId: selectedTestPoint.suiteId,
                    testCaseId: currentTestCase.testCase.id,
                    testCaseName: selectedTestPoint["System.Title"],
                    testConfigurationId: newTestPointAssignment.configuration.id,
                    testConfigurationName: newTestPointAssignment.configuration.name,
                    assignee: newTestPointAssignment.tester.uniqueName,
                    assigneeDisplayName: newTestPointAssignment.tester.displayName
                };
            }
        }

        if(currentTestCaseIndex==testCases.length-1){
            dialogSvc.openMessageDialog('No one to notify, since this is the last test case in the suite!!');
            return null;
        }

        const newTestCase=testCases[currentTestCaseIndex+1];
        newTestPointAssignment=newTestCase.pointAssignments[0];
        return {
            projectName: projectName,
            testPlanId: testPlanId,
            testSuiteId: selectedTestPoint.suiteId,
            testCaseId: newTestCase.testCase.id,
            testCaseName: await getTestCaseTitle(parseInt(newTestCase.testCase.id)),
            testConfigurationId: newTestPointAssignment.configuration.id,
            testConfigurationName: newTestPointAssignment.configuration.name,
            assignee: newTestPointAssignment.tester.uniqueName,
            assigneeDisplayName: newTestPointAssignment.tester.displayName
        };

    }else
    {
        console.log('Error initializing Test Client');
    }

    console.log('Out: getNotificationDetails');

    return null;
}

async function getTestCaseTitle(testCaseWorkItemId:number){
    const witClient=await getClient(WorkItemTrackingRestClient);
    const workItem=await witClient.getWorkItem(testCaseWorkItemId);
    let result= workItem.fields['System.Title'];
    return result;

}

async function createNotification(notificationDetails:INotificationModel):Promise<any> {

    console.log('In: createNotification');

    const workItemPayload = [
        {
            "op": "add",
            "path": "/fields/System.Title",
            "value": `Notification - Proceed with the test case - ${notificationDetails.testCaseName} `
        },
        {
            "op": "add",
            "path": "/fields/System.Description",
            "value": `${notificationDetails.assigneeDisplayName}, please continue with the execution of "${notificationDetails.testCaseName}". The previous test case just passed`
        },
        {
            "op": "add",
            "path": "/fields/System.AssignedTo",
            "value": notificationDetails.assignee
        },
        {
            "op": "add",
            "path": "/fields/System.AreaPath",
            "value": `${notificationDetails.projectName}\\Notifications`
        },
        {
            "op": "add",
            "path": "/fields/System.IterationPath",
            "value": notificationDetails.projectName
        }
    ];

    console.log('Out: createNotification');

    return workItemPayload;

}

async function getPlanIdFromUrl(): Promise<number|null> {

    const queryStringParams=await getQueryStringParameters();

    const planId=queryStringParams['planId'];

    return planId!=null ? parseInt(planId,10) : null; 

  }

async function getQueryStringParameters(): Promise<Record<string, string>> {
    const hostNavigationService = await SDK.getService<IHostNavigationService>(CommonServiceIds.HostNavigationService);
    const queryParams = await hostNavigationService.getQueryParams();
    return queryParams;
  }
  

SDK.init();