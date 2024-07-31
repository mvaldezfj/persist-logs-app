import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  DataTable,
  Pagination,
  DatePicker,
  TextField,
  Icon,
  Popover,
  Box,
  InlineStack,
  Button,
  Scrollable,
  OptionList,
  Select,
  InlineGrid,
  useBreakpoints,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useEffect, useRef, useState } from "react";
import { CalendarIcon, ArrowRightIcon } from "@shopify/polaris-icons";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") ?? "", 10) || 1;
  const nextPageInfo = JSON.parse(url.searchParams.get("pageInfo") ?? "{}");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  const filterParams: any = {
    session: session,
    limit: 25,
    ...nextPageInfo,
  };

  if (startDate)
    filterParams.created_at_min = new Date(startDate).toISOString();
  if (endDate) filterParams.created_at_max = new Date(endDate).toISOString();

  try {
    const events = await admin.rest.resources.Event.all(filterParams);
    console.log(events.data)
    return json({ events: events.data, page, pageInfo: events.pageInfo! });
  } catch (error) {
    console.error("loader error", error);
    return null;
  }
};

function formatDate(dateString: string) {
  const options: any = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

export default function Index() {
  const [selectedDate, setSelectedDate] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({ start: undefined, end: undefined });
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  if (!data) return null;

  const nextPage = () => {
    navigate(
      `?page=${data.page + 1}&pageInfo=${JSON.stringify(data.pageInfo?.nextPage?.query)}`,
    );
  };

  const prevPage = () => {
    navigate(
      `?page=${data.page - 1}&pageInfo=${JSON.stringify(data.pageInfo?.prevPage?.query)}`,
    );
  };

  const onSelectDate = () => {
    const startDate = selectedDate.start
      ? selectedDate.start.toISOString().slice(0, 10)
      : "";
    const endDate = selectedDate.end
      ? selectedDate.end.toISOString().slice(0, 10)
      : "";
    navigate(`?page=1&startDate=${startDate}&endDate=${endDate}`);
  };

  const onClearFilters = () => {
    navigate(`?page=${data.page}`);
  };

  const rows = data?.events.map((item) => [
    formatDate(item.created_at),
    item.description,
    item.subject_type,
    item.verb,
    item.author,
    <Button key={item.id} onClick={() => navigate("/app/event/" + item.id)}>
      View details
    </Button>,
  ]);

  return (
    <Page>
      <TitleBar title="Shopify logs"></TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section variant="fullWidth">
            <Card>
              <InlineStack align="space-between">
                <Pagination
                  hasPrevious={Boolean(data.pageInfo?.prevPage)}
                  onPrevious={prevPage}
                  hasNext={Boolean(data.pageInfo?.nextPage)}
                  onNext={nextPage}
                />
                <DateRangePicker
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  onSelectDate={onSelectDate}
                />
                <Button variant="primary" onClick={onClearFilters}>
                  Clear
                </Button>
              </InlineStack>
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text"]}
                headings={[
                  "Created At",
                  "Description",
                  "Subject Type",
                  "Verb",
                  "Author",
                  "Action"
                ]}
                rows={rows}
              />
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

// DateRangePicker component
function DateRangePicker({
  selectedDate,
  setSelectedDate,
  onSelectDate,
}: {
  selectedDate: {
    start: Date | undefined;
    end: Date | undefined;
  };
  setSelectedDate: React.Dispatch<
    React.SetStateAction<{
      start: Date | undefined;
      end: Date | undefined;
    }>
  >;
  onSelectDate: () => void;
}) {
  const { mdDown, lgUp } = useBreakpoints();
  const shouldShowMultiMonth = lgUp;
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const yesterday = new Date(
    new Date(new Date().setDate(today.getDate() - 1)).setHours(0, 0, 0, 0),
  );
  const ranges = [
    {
      title: "Today",
      alias: "today",
      period: {
        since: today,
        until: today,
      },
    },
    {
      title: "Yesterday",
      alias: "yesterday",
      period: {
        since: yesterday,
        until: yesterday,
      },
    },
    {
      title: "Last 7 days",
      alias: "last7days",
      period: {
        since: new Date(
          new Date(new Date().setDate(today.getDate() - 7)).setHours(
            0,
            0,
            0,
            0,
          ),
        ),
        until: yesterday,
      },
    },
  ];
  const [popoverActive, setPopoverActive] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState(ranges[0]);
  const [inputValues, setInputValues] = useState({});
  const [{ month, year }, setDate] = useState({
    month: activeDateRange.period.since.getMonth(),
    year: activeDateRange.period.since.getFullYear(),
  });
  const datePickerRef = useRef(null);
  const VALID_YYYY_MM_DD_DATE_REGEX = /^\d{4}-\d{1,2}-\d{1,2}/;

  function isDate(date: Date) {
    return !isNaN(new Date(date).getDate());
  }

  function isValidYearMonthDayDateString(date: Date) {
    return VALID_YYYY_MM_DD_DATE_REGEX.test(date) && isDate(date);
  }

  function isValidDate(date: Date) {
    return date.length === 10 && isValidYearMonthDayDateString(date);
  }

  function parseYearMonthDayDateString(input) {
    const [year, month, day] = input.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  function formatDateToYearMonthDayDateString(date: Date) {
    const year = String(date.getFullYear());
    let month = String(date.getMonth() + 1);
    let day = String(date.getDate());
    if (month.length < 2) {
      month = String(month).padStart(2, "0");
    }
    if (day.length < 2) {
      day = String(day).padStart(2, "0");
    }
    return [year, month, day].join("-");
  }

  function formatDate(date: Date) {
    return formatDateToYearMonthDayDateString(date);
  }

  function nodeContainsDescendant(rootNode, descendant) {
    if (rootNode === descendant) {
      return true;
    }
    let parent = descendant.parentNode;
    while (parent != null) {
      if (parent === rootNode) {
        return true;
      }
      parent = parent.parentNode;
    }
    return false;
  }

  function handleStartInputValueChange(value: Date) {
    setInputValues((prevState) => ({ ...prevState, since: value }));
    if (isValidDate(value)) {
      const newSince = parseYearMonthDayDateString(value);
      setActiveDateRange((prevState) => {
        const newPeriod =
          prevState.period && newSince <= prevState.period.until
            ? { since: newSince, until: prevState.period.until }
            : { since: newSince, until: newSince };
        return {
          ...prevState,
          period: newPeriod,
        };
      });
      setSelectedDate((prevState) => ({
        ...prevState,
        start: newSince,
      }));
    }
  }

  function handleEndInputValueChange(value: Date) {
    setInputValues((prevState) => ({ ...prevState, until: value }));
    if (isValidDate(value)) {
      const newUntil = parseYearMonthDayDateString(value);
      setActiveDateRange((prevState) => {
        const newPeriod =
          prevState.period && newUntil >= prevState.period.since
            ? { since: prevState.period.since, until: newUntil }
            : { since: newUntil, until: newUntil };
        return {
          ...prevState,
          period: newPeriod,
        };
      });
      setSelectedDate((prevState) => ({
        ...prevState,
        end: newUntil,
      }));
    }
  }

  function handleInputBlur() {
    const { since, until } = inputValues as any;
    if (!isValidDate(since)) {
      setInputValues((prevState) => ({
        ...prevState,
        since: formatDate(activeDateRange.period.since),
      }));
    }
    if (!isValidDate(until)) {
      setInputValues((prevState) => ({
        ...prevState,
        until: formatDate(activeDateRange.period.until),
      }));
    }
  }

  function handleMonthChange(month, year) {
    setDate({ month, year });
  }

  function handleCalendarChange({ start, end }) {
    const newDateRange = ranges.find((range) => {
      return (
        range.period.since.valueOf() === start.valueOf() &&
        range.period.until.valueOf() === end.valueOf()
      );
    }) || {
      alias: "custom",
      title: "Custom",
      period: {
        since: start,
        until: end,
      },
    };
    setActiveDateRange(newDateRange);
    setSelectedDate({ start, end });
  }

  function apply() {
    onSelectDate();
    setPopoverActive(false);
  }

  function cancel() {
    setPopoverActive(false);
  }

  useEffect(() => {
    if (activeDateRange) {
      setInputValues({
        since: formatDate(activeDateRange.period.since),
        until: formatDate(activeDateRange.period.until),
      });
      function monthDiff(referenceDate, newDate) {
        return (
          newDate.month -
          referenceDate.month +
          12 * (referenceDate.year - newDate.year)
        );
      }
      const monthDifference = monthDiff(
        { year, month },
        {
          year: activeDateRange.period.until.getFullYear(),
          month: activeDateRange.period.until.getMonth(),
        },
      );
      if (monthDifference > 1 || monthDifference < 0) {
        setDate({
          month: activeDateRange.period.until.getMonth(),
          year: activeDateRange.period.until.getFullYear(),
        });
      }
    }
  }, [activeDateRange]);

  const buttonValue =
    activeDateRange.title === "Custom"
      ? activeDateRange.period.since.toDateString() +
        " - " +
        activeDateRange.period.until.toDateString()
      : activeDateRange.title;

  return (
    <Popover
      active={popoverActive}
      autofocusTarget="none"
      preferredAlignment="left"
      preferredPosition="below"
      fluidContent
      sectioned={false}
      fullHeight
      activator={
        <Button
          size="slim"
          icon={CalendarIcon}
          onClick={() => setPopoverActive(!popoverActive)}
        >
          {buttonValue}
        </Button>
      }
      onClose={() => setPopoverActive(false)}
    >
      <Popover.Pane fixed>
        <InlineGrid
          columns={{
            xs: "1fr",
            mdDown: "1fr",
            md: "max-content max-content",
          }}
          gap={0}
          ref={datePickerRef}
        >
          <Box
            maxWidth={mdDown ? "516px" : "212px"}
            width={mdDown ? "100%" : "212px"}
            padding={{ xs: "500", md: "0" }}
            paddingBlockEnd={{ xs: "100", md: "0" }}
          >
            {mdDown ? (
              <Select
                label="dateRangeLabel"
                labelHidden
                onChange={(value) => {
                  const result = ranges.find(
                    ({ title, alias }) => title === value || alias === value,
                  );
                  setActiveDateRange(result);
                }}
                value={activeDateRange?.title || activeDateRange?.alias || ""}
                options={ranges.map(({ alias, title }) => title || alias)}
              />
            ) : (
              <Scrollable style={{ height: "334px" }}>
                <OptionList
                  options={ranges.map((range) => ({
                    value: range.alias,
                    label: range.title,
                  }))}
                  selected={[activeDateRange.alias]}
                  onChange={(value) => {
                    setActiveDateRange(
                      ranges.find((range) => range.alias === value[0]),
                    );
                  }}
                />
              </Scrollable>
            )}
          </Box>
          <Box padding={{ xs: "500" }} maxWidth={mdDown ? "320px" : "516px"}>
            <BlockStack gap="400">
              <InlineStack gap="200">
                <div style={{ flexGrow: 1 }}>
                  <TextField
                    role="combobox"
                    label={"Since"}
                    labelHidden
                    prefix={<Icon source={CalendarIcon} />}
                    value={inputValues.since}
                    onChange={handleStartInputValueChange}
                    onBlur={handleInputBlur}
                    autoComplete="off"
                  />
                </div>
                <Icon source={ArrowRightIcon} />
                <div style={{ flexGrow: 1 }}>
                  <TextField
                    role="combobox"
                    label={"Until"}
                    labelHidden
                    prefix={<Icon source={CalendarIcon} />}
                    value={inputValues.until}
                    onChange={handleEndInputValueChange}
                    onBlur={handleInputBlur}
                    autoComplete="off"
                  />
                </div>
              </InlineStack>
              <div>
                <DatePicker
                  month={month}
                  year={year}
                  selected={{
                    start: activeDateRange.period.since,
                    end: activeDateRange.period.until,
                  }}
                  onMonthChange={handleMonthChange}
                  onChange={handleCalendarChange}
                  multiMonth={shouldShowMultiMonth}
                  allowRange
                />
              </div>
            </BlockStack>
          </Box>
        </InlineGrid>
      </Popover.Pane>
      <Popover.Pane fixed>
        <Popover.Section>
          <InlineStack align="end">
            <Button onClick={cancel}>Cancel</Button>
            <Button onClick={apply}>Apply</Button>
          </InlineStack>
        </Popover.Section>
      </Popover.Pane>
    </Popover>
  );
}
