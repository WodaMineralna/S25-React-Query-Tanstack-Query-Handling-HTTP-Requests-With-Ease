import {
  Link,
  redirect,
  useNavigate,
  useNavigation,
  useParams,
  useSubmit,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { fetchEvent, updateEvent } from "../../util/http.js";
import { queryClient } from "../../util/queryClient.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function EditEvent() {
  const navigate = useNavigate();
  const { state } = useNavigation();
  const submit = useSubmit();
  const { id } = useParams();

  // * zostawiamy useQuery() tutaj pomimo uzywania go w loaderze, poniewaz i tak to wszystko bedzie cached
  // * i zachowujemy nasze advantages z korzystania z useQuery() - np re-fetch gdy user wytabuje poza strone, etc...
  const { data, isError, error } = useQuery({
    queryKey: ["events", id],
    queryFn: ({ signal }) => fetchEvent({ signal, id }),
    staleTime: 10000,
  });

  // const { mutate } = useMutation({
  //   mutationFn: updateEvent,
  //   onMutate: async (dataPassedToMutate) => {
  //     const updatedEventData = dataPassedToMutate.event;

  //     await queryClient.cancelQueries({ queryKey: ["events", id] }); // cancels Queries triggered with useQuery()
  //     const prevEventData = queryClient.getQueryData(["events", id]);

  //     queryClient.setQueryData(["events", id], updatedEventData);

  //     return { prevEventData };
  //   },
  //   onError: (error, data, context) => {
  //     queryClient.setQueryData(["events", id], context.prevEventData);
  //   },
  //   onSettled: () => {
  //     queryClient.invalidateQueries(["events", id]);
  //   },
  //   // ^ not handling 'isPending' / ... here, because of Optimistic Updating
  // });

  function handleSubmit(formData) {
    submit(formData, { method: "PUT" }); // ! submit() triggeruje client-side action() Fn, NIE WYSYLA HTTP REQUEST'u!!
  }

  function handleClose() {
    navigate("../");
  }

  let content;

  // ^ moglibysmy uzyc Error Handling capabilities React-Router'a, ale juz ciul w to
  if (isError) {
    content = (
      <>
        <ErrorBlock
          title="An error occured!"
          message={error.info?.message || "Could not fetch the event data"}
        />
        <div className="form-actions">
          <Link to="../" className="button">
            Okay
          </Link>
        </div>
      </>
    );
  }

  if (data) {
    content = (
      <EventForm inputData={data} onSubmit={handleSubmit}>
        {state === "submitting" ? (
          <span>Sending data...</span>
        ) : (
          <>
            <Link to="../" className="button-text">
              Cancel
            </Link>
            <button type="submit" className="button">
              Update
            </button>
          </>
        )}
      </EventForm>
    );
  }

  return <Modal onClose={handleClose}>{content}</Modal>;
}

export function loader({ params }) {
  const id = params.id;

  return queryClient.fetchQuery({
    queryKey: ["events", id],
    queryFn: ({ signal }) => fetchEvent({ signal, id }),
  });
}

export async function action({ request, params }) {
  const formData = await request.formData();
  const updatedEventData = Object.fromEntries(formData);

  await updateEvent({ id: params.id, event: updatedEventData });
  await queryClient.invalidateQueries(["events"]); // papa dla optimistic update'owania - musielibysmy napisac nasza wlasna logike w 'handleSubmit()'
  return redirect("../");
}
