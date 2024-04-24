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

            const witClient=await getClient(WorkItemTrackingRestClient);
            
            /*const workItemPayload = {
                "fields": {
                    "System.Title": `Notify ${selectedTestPoint.assignedTo} on ${selectedTestPoint["System.Title"]}`,
                    "System.AreaPath": `${projectName}\\Notifications`,
                    "System.IterationPath": projectName,
                }
            };*/

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


            try {

                const createdNotification = await witClient.createWorkItem(workItemPayload, projectName, "Notification"); 
                /*const task= await witClient.getWorkItem(9)  ;
                console.log(task);*/
                console.log(createdNotification);
                const dialogSvc = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
                dialogSvc.openMessageDialog(`${selectedTestPoint.assignedTo} notified to start!!${selectedTestPoint["System.Title"]}`, { showCancel: false });
            } catch (error) {
                console.log("Error in creating Notification:" + error)
            }

        }
    }
});

/*SDK.register("notify-next-test-case-assignee", () => {
    return {
        execute: async (context: any[]) => {
            debugger;
            console.log(context[0].System.Title);
            const result = await getClient(BuildRestClient).getDefinition(context.project.id, context.id, undefined, undefined, undefined, true);
            const result={name: "Shaiju"}
            const dialogSvc = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
            dialogSvc.openMessageDialog(`Fetched build definition ${result.name}. Latest build: ${JSON.stringify(result.latestBuild)}`, { showCancel: false });
            dialogSvc.openMessageDialog(`Name: ${result.name}, testSuiteId:${context.suite.name}`, { showCancel: false });
            dialogSvc.openMessageDialog(`Name: ${result.name}`, { showCancel: false });
        }
    }
});
*/

SDK.init();