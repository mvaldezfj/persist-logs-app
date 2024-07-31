import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { BlockStack, Button, Card, Page } from "@shopify/polaris";
import { useLoaderData, useNavigate } from "@remix-run/react";
import prisma from "~/db.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  let { eventId } = params;
  const event = await prisma.event.findFirst({
    where: { id: Number(eventId) },
  });
  return json({
    event: {
      ...event,
      eventId: event?.eventId.toString(),
      subjectId: event?.subjectId.toString(),
    },
  });
}

export default function EventDetailsPage() {
  const { event } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <Page title="Event">
      <Button onClick={() => navigate("/app")}>Go back</Button>
      <Card>
        <BlockStack>
          <p>
            <strong>Created At:</strong>{" "}
            {new Date(event.createdAt!).toLocaleString()}
          </p>
          <p>
            <strong>Description:</strong> {event.description}
          </p>
          <p>
            <strong>ID:</strong> {event.id}
          </p>
          <p>
            <strong>Path:</strong> {event.path}
          </p>
          <p>
            <strong>Subject ID:</strong> {event.subjectId?.toString()}
          </p>
          <p>
            <strong>Subject Type:</strong> {event.subjectType}
          </p>
          <p>
            <strong>Verb:</strong> {event.verb}
          </p>
          <p>
            <strong>Author:</strong> {event.author}
          </p>
        </BlockStack>
      </Card>
    </Page>
  );
}
