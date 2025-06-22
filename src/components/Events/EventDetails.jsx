import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";

import { fetchEvent, deleteEvent } from "../../util/http.js";

import Header from "../Header.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import { queryClient } from "../../util/queryClient.js";
import LoadingIndicator from "../UI/LoadingIndicator.jsx";

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["event", { id }],
    queryFn: ({ signal }) => fetchEvent({ signal, id }),
    staleTime: 15000,
  });

  const {
    mutate,
    isPending: isMutationPending,
    isError: isMutationError,
    error: mutationError,
  } = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries("event"); // ? needed?
      navigate("/events");
    },
  });

  console.log(data); // DEBUG

  function handleDeletion() {
    mutate({ id });
  }

  return (
    <>
      <Outlet />
      <Header>
        <Link to="/events" className="nav-item">
          View all Events
        </Link>
      </Header>
      {isPending ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorBlock
          title="An error occured!"
          message={
            error.info?.message || "There was an error loading event data"
          }
        />
      ) : (
        <article id="event-details">
          <header>
            <h1>{data?.title}</h1>
            <nav>
              <button onClick={handleDeletion} disabled={isMutationPending}>
                Delete
              </button>
              <Link to="edit" disabled={isMutationPending}>
                Edit
              </Link>
            </nav>
          </header>
          <div id="event-details-content">
            <img src={`http://192.168.1.18:3000/${data?.image}`} alt={data?.image} />
            <div id="event-details-info">
              <div>
                <p id="event-details-location">{data?.location}</p>
                <time
                  dateTime={`${data?.date} ${data?.time}`}
                >{`${data?.date}, ${data?.time}`}</time>
              </div>
              <p id="event-details-description">{data?.description}</p>
            </div>
          </div>
        </article>
      )}
      {isMutationError && (
        <ErrorBlock
          title="Failed to delete the event"
          message={mutationError.info?.message || "Could not delete the event"}
        />
      )}
    </>
  );
}
