"use client";

import {
  collection,
  doc,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from "firebase/firestore";
import { getFirebase } from "./client";

function resolveDb(db?: Firestore): Firestore {
  return db ?? getFirebase().db;
}

export function userDocRef(uid: string, db?: Firestore): DocumentReference<DocumentData> {
  return doc(resolveDb(db), "users", uid);
}

export function userProgressDocRef(
  uid: string,
  dialectId: string,
  db?: Firestore,
): DocumentReference<DocumentData> {
  return doc(resolveDb(db), "users", uid, "progress", dialectId);
}

export function userStampDocRef(
  uid: string,
  stampId: string,
  db?: Firestore,
): DocumentReference<DocumentData> {
  return doc(resolveDb(db), "users", uid, "stamps", stampId);
}

export function userTelemetrySummaryDocRef(
  uid: string,
  db?: Firestore,
): DocumentReference<DocumentData> {
  return doc(resolveDb(db), "users", uid, "telemetry", "summary");
}

export function userDrillResultDocRef(
  uid: string,
  clientEventId: string,
  db?: Firestore,
): DocumentReference<DocumentData> {
  return doc(resolveDb(db), "users", uid, "drillResults", clientEventId);
}

export function languagesColRef(db?: Firestore): CollectionReference<DocumentData> {
  return collection(resolveDb(db), "languages");
}

export function dialectsColRef(db?: Firestore): CollectionReference<DocumentData> {
  return collection(resolveDb(db), "dialects");
}

export function scenariosColRef(db?: Firestore): CollectionReference<DocumentData> {
  return collection(resolveDb(db), "scenarios");
}

export function glossaryColRef(db?: Firestore): CollectionReference<DocumentData> {
  return collection(resolveDb(db), "glossary");
}

export function trainerSubmissionsColRef(db?: Firestore): CollectionReference<DocumentData> {
  return collection(resolveDb(db), "trainerSubmissions");
}

export function trainerRequestDocRef(
  uid: string,
  db?: Firestore,
): DocumentReference<DocumentData> {
  return doc(resolveDb(db), "trainerRequests", uid);
}
