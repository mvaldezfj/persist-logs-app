import { Await, defer, useLoaderData, useNavigate } from "@remix-run/react";
import prisma from "~/db.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import React from "react";
import {
  Card,
  Pagination,
  DataTable,
  Page,
  Layout,
  BlockStack,
  InlineStack,
  Text,
  Button,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") ?? "10", 10);

  const userId = session.shop;
  let user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    user = await prisma.user.create({
      data: { email: "test@gmail.com", id: userId },
    });
  }

  const fetchAndStoreEvents = async () => {
    const lastEvent = await prisma.event.findFirst({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
    });

    let pageInfo;
    const lastCreatedAt = lastEvent ? new Date(lastEvent.createdAt) : new Date(0);

    do {
      const response = await admin.rest.resources.Event.all({
        ...pageInfo?.nextPage?.query,
        session,
        limit: 250,
        created_at_min: lastCreatedAt.toISOString(),
      });

      const events = response.data;

      for (let event of events) {
        const existingEvent = await prisma.event.findUnique({
          where: { eventId: event.id! },
        });

        if (!existingEvent) {
          await prisma.event.create({
            data: {
              userId: userId,
              arguments: JSON.stringify(event.arguments),
              body: event.body,
              createdAt: new Date(event.created_at!),
              description: event.description ?? "",
              eventId: event.id ?? 0,
              message: event.message ?? "",
              path: event.path ?? "",
              subjectId: event.subject_id ?? 0,
              subjectType: event.subject_type ?? "",
              verb: event.verb ?? "",
              author: event.author,
            },
          });
        }
      }

      pageInfo = response.pageInfo;
    } while (pageInfo?.nextPage);
  };

  if (!user.initialMigration) {
    await fetchAndStoreEvents();
    await prisma.user.update({
      where: { id: user.id },
      data: { initialMigration: true },
    });
  } else {
    await fetchAndStoreEvents();
  }

  const events = await prisma.event.findMany({
    where: { userId: userId },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: "desc" },
  });

  const totalEvents = await prisma.event.count({ where: { userId: userId } });
  const totalPages = Math.ceil(totalEvents / pageSize);

  return defer({
    user,
    events: events.map((e) => ({
      ...e,
      eventId: e.eventId.toLocaleString(),
      subjectId: e.subjectId.toLocaleString(),
    })),
    pagination: {
      page,
      pageSize,
      totalPages,
    },
  });
};

export default function Login() {
  const { events } = useLoaderData<typeof loader>();
  return (
    <div>
      <React.Suspense
        fallback={<p>Loading your events, this might take a while...</p>}
      >
        <Await resolve={events} errorElement={<p>Error loading events!</p>}>
          {() => (
            <Page>
              <TitleBar title="Shopify logs app" />
              <Events />
            </Page>
          )}
        </Await>
      </React.Suspense>
    </div>
  );
}

function Events() {
  const { events, pagination } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const rows = events.map((event) => [
    event.subjectType,
    event.description,
    new Date(event.createdAt).toDateString(),
    <Button key={event.id} onClick={() => navigate("/app/event/" + event.id)}>
      View details
    </Button>,
  ]);

  const handlePageChange = (page: number) => {
    navigate(`?page=${page}&pageSize=${pagination.pageSize}`);
  };

  return (
    <Layout>
      <Layout.Section variant="fullWidth">
        <Card>
          <BlockStack gap="1000">
            <DataTable
              columnContentTypes={["text", "text", "text"]}
              headings={["Type", "Description", "Created At", "Action"]}
              rows={rows}
            />
            <InlineStack align="start" blockAlign="center" gap="1000">
              <Pagination
                hasPrevious={pagination.page > 1}
                hasNext={pagination.page < pagination.totalPages}
                onPrevious={() => handlePageChange(pagination.page - 1)}
                onNext={() => handlePageChange(pagination.page + 1)}
              />
              <Text as="h4">
                Page {pagination.page}
              </Text>
            </InlineStack>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );
}
