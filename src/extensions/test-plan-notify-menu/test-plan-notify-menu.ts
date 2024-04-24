import "es6-promise/auto";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, getClient, IHostPageLayoutService } from "azure-devops-extension-api";
import { WorkItemTrackingRestClient, IWorkItemFormService} from "azure-devops-extension-api/WorkItemTracking";
import { TestPoint, TestRestClient } from "azure-devops-extension-api/Test";


SDK.register("notify-next-test-case-assignee", () => {
    return {
        execute: async (context: TestPoint[]) => {

            const dialogSvc = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
            dialogSvc.openMessageDialog(`${context[0].assignedTo} notified!!`, { showCancel: false });
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