import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { fetchEvent, updateEvent } from "../../util/http.js";
import { queryClient } from "../../util/queryClient.js";
import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["events", id],
    queryFn: ({ signal }) => fetchEvent({ signal, id }),
  });

  const { mutate } = useMutation({
    mutationFn: updateEvent,
    onMutate: async (dataPassedToMutate) => {
      const updatedEventData = dataPassedToMutate.event;

      await queryClient.cancelQueries({ queryKey: ["events", id] }); // cancels Queries triggered with useQuery()
      const prevEventData = queryClient.getQueryData(["events", id]);

      queryClient.setQueryData(["events", id], updatedEventData);

      return { prevEventData };
    },
    onError: (error, data, context) => {
      queryClient.setQueryData(["events", id], context.prevEventData);
    },
    onSettled: () => {
      queryClient.invalidateQueries(["events", id]);
    },
    // ^ not handling 'isPending' / ... here, because of Optimistic Updating
  });

  function handleSubmit(formData) {
    mutate({ id, event: formData });
    handleClose(); // doing it here, instead of in 'onSuccess()`, because of Optimistic Updating
  }

  function handleClose() {
    navigate("../");
  }

  let content;

  if (isPending) {
    content = (
      <div className="center">
        <LoadingIndicator />
      </div>
    );
  }

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
        <Link to="../" className="button-text">
          Cancel
        </Link>
        <button type="submit" className="button">
          Update
        </button>
      </EventForm>
    );
  }

  return <Modal onClose={handleClose}>{content}</Modal>;
}
