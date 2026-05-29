import { API } from '../api.js';

export async function fetchClubById(clubId) {
    return API.getClubById(clubId);
}

export async function fetchAllEvents() {
    return API.getEvents();
}

export async function uploadCoverImage(file, prefix) {
    const data = await API.uploadMedia(file, prefix);
    return data.path;
}

export async function createEvent(payload) {
    return API.createEvent(payload);
}

export async function reviewEvent(id, payload) {
    return API.reviewEvent(id, payload);
}

export async function submitEventFeedback(payload) {
    return API.submitEventFeedback(payload);
}
