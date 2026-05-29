// n importiw touskié hajetna bih
// nidham saaahbi
import {
  createEvent,
  fetchAllEvents,
  fetchClubById,
  uploadCoverImage,
} from "./club-dashboard/api.js";
import {
  DEFAULT_CLUB_ID,
  EVENT_MANAGER_CLUB_NAME_BY_ID,
} from "./club-dashboard/constants.js";
import {
  applyRoleVisibility,
  bindSidebar,
  getDashboardDom,
  renderClubProfile,
  renderDoneEvents,
  renderFeedbackEventOptions,
  renderHistoryEvents,
  renderLoadError,
  renderPendingEvents,
  setFormStatus,
} from "./club-dashboard/render.js?v=4";
import {
  getRequestedClubId,
  normalizeText,
  splitEventsByDate,
} from "./club-dashboard/utils.js";
// awel ma tethal page dashboard yekhdem logique hedha
// |
// ∨
document.addEventListener("DOMContentLoaded", () => {
  const dom = getDashboardDom();
  let activeClub = null;
  // taatina l id wel ism mte3 l club li mawjoud fel lien (active club)
  function getClubContext() {
    const requestedClubId = getRequestedClubId();

    if (activeClub?.id && activeClub?.name) {
      return {
        clubId: activeClub.id,
        clubName:
          EVENT_MANAGER_CLUB_NAME_BY_ID[activeClub.id] || activeClub.name,
      };
    }

    const resolvedId = EVENT_MANAGER_CLUB_NAME_BY_ID[requestedClubId]
      ? requestedClubId
      : DEFAULT_CLUB_ID;

    return {
      clubId: resolvedId,
      clubName: EVENT_MANAGER_CLUB_NAME_BY_ID[resolvedId],
    };
  }
  // taatiha l events li aandek lkol w club X
  // trajaalek l events li teb3in X
  function getClubEvents(allEvents, club) {
    const normalizedClubName = normalizeText(club.name);
    const normalizedManagerName = normalizeText(
      EVENT_MANAGER_CLUB_NAME_BY_ID[club.id],
    );
    const imageToken = `/assets/images/${club.id}/`;

    return allEvents.filter((event) => {
      const eventClubName = normalizeText(event.club);
      const clubLogoPath = String(event.clubLogo || "");

      return (
        eventClubName === normalizedClubName ||
        eventClubName === normalizedManagerName ||
        clubLogoPath.includes(imageToken)
      );
    });
  }
  // nestaamlou data li jebneha w naltkhouha (rendering) aal dashboard
  function applyClubDashboardContent(club, events) {
    const pendingEvents = events.filter(e => !e.is_approved);
    const approvedEvents = events.filter(e => e.is_approved);
    const { upcomingEvents, finishedEvents } = splitEventsByDate(approvedEvents);

    renderClubProfile(dom, club, approvedEvents);
    renderPendingEvents(dom, club, pendingEvents);
    renderHistoryEvents(dom, club, finishedEvents);
    renderDoneEvents(dom, club, finishedEvents);
    renderFeedbackEventOptions(dom, finishedEvents);
    // Gate the management links (Create / Pending / Done) to this club's moderator or an admin.
    applyRoleVisibility(dom, club);
  }
  // the final boss
  // nestaamlou kol chy w naamrou l dashboard
  async function loadDashboardData() {
    const requestedClubId = getRequestedClubId() || DEFAULT_CLUB_ID;

    try {
      let club;
      try {
        club = await fetchClubById(requestedClubId);
      } catch {
        // Fallback to default club when an unknown club id is provided in URL.
        club = await fetchClubById(DEFAULT_CLUB_ID);
      }

      const allEvents = await fetchAllEvents();
      const clubEvents = getClubEvents(allEvents, club);

      activeClub = club;
      applyClubDashboardContent(club, clubEvents);
    } catch (error) {
      renderLoadError(dom, error.message);
    }
  }
  // logique li tsir ki wehed y submitti form "create event"
  dom.createForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = dom.createForm.querySelector(".event-create-submit");
    const originalButtonText = submitButton?.textContent || "Suggest Event";

    try {
      setFormStatus(dom, "Submitting event...");

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
      }

      const formData = new FormData(dom.createForm);
      const file = formData.get("event-cover");
      if (!(file instanceof File) || !file.size) {
        throw new Error("Please choose a cover image.");
      }

      const { clubId, clubName } = getClubContext();
      const uploadedImagePath = await uploadCoverImage(file, clubId);

      const title = String(formData.get("event-title") || "").trim();
      const date = String(formData.get("event-date") || "").trim();
      const startTime = String(formData.get("event-start") || "").trim();
      const endTime = String(formData.get("event-end") || "").trim();
      const maxParticipants = Number(formData.get("event-places") || 0);
      const location = String(formData.get("event-location") || "").trim();
      const description = String(
        formData.get("event-description") || "",
      ).trim();

      const eventPayload = {
        title,
        club: clubName,
        clubLogo: `../assets/images/${clubId}/profile.jpg`,
        image: uploadedImagePath,
        date,
        time: startTime,
        location,
        description: `${description}${endTime ? `\nEnd time: ${endTime}` : ""}`,
        participants: 0,
        maxParticipants,
        featured: false,
      };

      await createEvent(eventPayload);
      dom.createForm.reset();
      setFormStatus(dom, "Event created successfully and linked to backend.");
      await loadDashboardData();
    } catch (error) {
      setFormStatus(
        dom,
        error.message || "Something went wrong while creating the event.",
        true,
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });

  // Admin Actions for Pending Events
  dom.pendingList?.addEventListener('click', async (e) => {
    if (e.target.classList.contains('approve-btn')) {
      const id = e.target.dataset.id;
      try {
        const { API } = await import('./api.js');
        await API.request(`/events.php?action=approve&id=${id}`, { method: 'PATCH', headers: API.getHeaders() });
        await loadDashboardData();
      } catch (err) {
        alert(err.message || 'Failed to approve event');
      }
    }
    if (e.target.classList.contains('reject-btn')) {
      const id = e.target.dataset.id;
      if (confirm('Are you sure you want to reject and delete this event?')) {
        try {
          const { API } = await import('./api.js');
          await API.deleteEvent(id);
          await loadDashboardData();
        } catch (err) {
          alert(err.message || 'Failed to reject event');
        }
      }
    }
  });

  bindSidebar(dom);
  loadDashboardData();
});
