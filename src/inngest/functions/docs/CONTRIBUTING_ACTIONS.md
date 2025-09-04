# How to Create a New Workflow Action

Welcome, contributor! This guide will walk you through the simple process of creating a new custom action for our workflow automation engine. Thanks to a dynamic loading system, you can create new actions without needing to be a TypeScript expert.

## The process is broken down into two main steps:

1.  **Define the Action**: Add a new entry to the `actions.json` file.
2.  **Implement the Logic**: Create a handler file that contains the code for your action.

---

### Step 1: Define Your Action in `actions.json`

First, you need to let the system know about your new action. To do this, open the `actions.json` file located in the `/inngest/workflow-actions/docs` directory.

You will see a list of existing actions. Add a new JSON object to this list for your action. It should look like this:

```json
{
  "id": "your-unique-action-id",
  "name": "A Descriptive Name for Your Action",
  "description": "A brief, optional summary of what your action does.",
  "inputs": {
    "input-field-one": {
      "name": "First Input",
      "description": "The description for your first input.",
      "type": "string",
      "required": true
    },
    "input-field-two": {
      "name": "Second Input",
      "description": "The description for your second input.",
      "type": "boolean",
      "required": false
    }
  },
  "handler": "../handlers/your-handler-file.ts"
}
```

#### Field Explanations:

*   `id`: A unique, kebab-case identifier for your action. **This must be unique!**
*   `name`: The human-readable name that will be displayed in the UI.
*   `description`: A short sentence explaining the purpose of the action.
*   `handler`: The path to the file that will execute the action's logic. By convention, this file should be inside the `handlers` directory.

**Example**:
If you were creating an action to send an email, you might add:
```json
{
  "id": "send-email",
  "name": "Send an Email",
  "description": "Sends an email using a specified mail service.",
  "handler": "../handlers/send-email.ts"
}
```

---

### Step 2: Implement the Action's Logic in a Handler File

Next, you need to create the file that will contain your action's logic.

1.  Navigate to the `inngest/workflow-actions/handlers/` directory.
2.  Create a new TypeScript file with the same name you specified in the `handler` field in `actions.json` (e.g., `send-email.ts`).
3.  Inside this new file, you will export a single asynchronous function named `handler`.

This function will receive all the context it needs, such as `event`, `step`, and details about the `workflowAction`. Your function should perform its task and return a result.

Here is a simple template to get you started:

```typescript
// /inngest/workflow-actions/handlers/your-handler-file.ts

export const handler = async ({ event, step, workflowAction }) => {
  // Your action logic goes here!
  console.log("Executing action:", workflowAction.name);

  // You can access data from the event that triggered the workflow
  const eventData = event.data;

  // Perform tasks, call APIs, etc.
  // For example, using a service:
  // const result = await someService.doSomething(eventData.someValue);

  // Return any data you want to make available to the next action
  return {
    message: "Action completed successfully!",
  };
};

```

---

### Creating and Using Reusable Services

To keep your code clean and organized, you shouldn't put complex logic directly inside your handler files. Instead, you can create **services** that your handlers can use.

A service is just a regular TypeScript file that exports functions. You can place your new services in the `/src/services/` directory.

#### Example:

Let's say you want to create a service for sending emails.

1.  **Create the service file**:
    Create a new file at `/src/services/email-service.ts`.

2.  **Write the service logic**:
    ```typescript
    // /src/services/email-service.ts

    export const sendEmail = async (to: string, subject: string, body: string) => {
      console.log(`Sending email to ${to} with subject "${subject}"`);
      // In a real application, you would integrate with an email API here
      // (e.g., SendGrid, Mailgun, etc.)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      console.log("Email sent!");
      return { success: true };
    };
    ```

3.  **Use the service in your handler**:
    Now, you can import and use this service in your action handler.

    ```typescript
    // /inngest/workflow-actions/handlers/send-email.ts
    import { sendEmail } from "../../../services/email-service";

    export const handler = async ({ event, step, workflowAction }) => {
      console.log("Executing action:", workflowAction.name);

      // Assuming the email details are passed in the event data
      const { to, subject, body } = event.data;

      if (!to || !subject || !body) {
        throw new Error("Missing required email parameters.");
      }

      const result = await sendEmail(to, subject, body);

      return {
        status: "Email sent successfully!",
        result,
      };
    };
    ```

That's it! By following these steps, you can easily contribute powerful new actions to the platform.
