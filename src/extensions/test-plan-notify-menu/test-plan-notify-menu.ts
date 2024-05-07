import "es6-promise/auto";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, getClient, IHostPageLayoutService } from "azure-devops-extension-api";
import { WorkItemTrackingRestClient} from "azure-devops-extension-api/WorkItemTracking";
import { TestPoint, TestRestClient } from "azure-devops-extension-api/Test";


SDK.register("notify-next-test-case-assignee", () => {
    return {
        execute: async (context: any[]) => {

            const selectedTestPoint:any=context[0];
            const projectName: string=selectedTestPoint["System.TeamProject"];
    
            await getNextTestCaseDetails(selectedTestPoint);
            
            const workItemPayload= await createNotification(selectedTestPoint);

            try {
                const witClient=await getClient(WorkItemTrackingRestClient);
                const createdNotification = await witClient.createWorkItem(workItemPayload, projectName, "Notification"); 
                console.log(createdNotification);
                const dialogSvc = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
                dialogSvc.openMessageDialog(`${selectedTestPoint.assignedTo} notified to start!!${selectedTestPoint["System.Title"]}`, { showCancel: false });
            } catch (error) {
                console.log("Error in creating Notification:" + error)
            }

        }
    }
});

async function getNextTestCaseDetails(selectedTestPoint:any)
{

    console.log('In: getNextTestCaseDetails');

    const testClient=await getClient(TestRestClient);
 
    if(testClient !=null){

        console.log('Test Client Initialized');

        const testCases=await testClient.getTestCases('project-101',3, selectedTestPoint.suiteId);

        console.log('Test Cases Retrieved');
    }else
    {
        console.log('Error initializing Test Client');
    }

    console.log('Out: getNextTestCaseDetails');
    
}

async function createNotification(selectedTestPoint:any):Promise<any> {

    console.log('In: createNotification');

    const projectName: string=selectedTestPoint["System.TeamProject"];

    const workItemPayload = [
        {
            "op": "add",
            "path": "/fields/System.Title",
            "value": `Notification - Proceed with the test case - ${selectedTestPoint["System.Title"]} `
        },
        {
            "op": "add",
            "path": "/fields/System.Description",
            "value": `${selectedTestPoint.assignedTo}, please continue with the execution of ${selectedTestPoint["System.Title"]}. The previous test case just passed`
        },
        {
            "op": "add",
            "path": "/fields/System.AssignedTo",
            "value": selectedTestPoint.assignedTo
        },
        {
            "op": "add",
            "path": "/fields/System.AreaPath",
            "value": `${projectName}\\Notifications`
        },
        {
            "op": "add",
            "path": "/fields/System.IterationPath",
            "value": projectName
        }
    ];

    console.log('Out: createNotification');

    return workItemPayload;

}


SDK.init();