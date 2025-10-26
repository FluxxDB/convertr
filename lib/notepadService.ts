import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { DeviceService } from './deviceService';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  lastEditedAt: Date;
}

export class NotepadService {
  private static instance: NotepadService;

  private constructor() {}

  public static getInstance(): NotepadService {
    if (!NotepadService.instance) {
      NotepadService.instance = new NotepadService();
    }
    return NotepadService.instance;
  }

  /**
   * Get the notes collection reference for the current device
   */
  private async getNotesCollection() {
    const deviceService = DeviceService.getInstance();
    const deviceId = await deviceService.getDeviceId();
    return collection(db, 'users', deviceId, 'notes');
  }

  /**
   * Create a new note
   */
  async createNote(title: string, content: string = ''): Promise<Note> {
    try {
      const notesCollection = await this.getNotesCollection();
      const noteId = `note_${Date.now()}`;
      const now = new Date();

      const note: Note = {
        id: noteId,
        title: title || 'Untitled Note',
        content,
        createdAt: now,
        lastEditedAt: now,
      };

      await setDoc(doc(notesCollection, noteId), {
        title: note.title,
        content: note.content,
        createdAt: Timestamp.fromDate(note.createdAt),
        lastEditedAt: Timestamp.fromDate(note.lastEditedAt),
      });

      console.log('[NotepadService] Note created:', noteId);
      return note;
    } catch (error) {
      console.error('[NotepadService] Error creating note:', error);
      throw error;
    }
  }

  /**
   * Get all notes for the current device
   */
  async getAllNotes(): Promise<Note[]> {
    try {
      const notesCollection = await this.getNotesCollection();
      const q = query(notesCollection, orderBy('lastEditedAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const notes: Note[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notes.push({
          id: doc.id,
          title: data.title || 'Untitled Note',
          content: data.content || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          lastEditedAt: data.lastEditedAt?.toDate() || new Date(),
        });
      });

      console.log('[NotepadService] Retrieved notes:', notes.length);
      return notes;
    } catch (error) {
      console.error('[NotepadService] Error getting notes:', error);
      throw error;
    }
  }

  /**
   * Get a single note by ID
   */
  async getNote(noteId: string): Promise<Note | null> {
    try {
      const notesCollection = await this.getNotesCollection();
      const noteDoc = await getDoc(doc(notesCollection, noteId));

      if (!noteDoc.exists()) {
        console.log('[NotepadService] Note not found:', noteId);
        return null;
      }

      const data = noteDoc.data();
      return {
        id: noteDoc.id,
        title: data.title || 'Untitled Note',
        content: data.content || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        lastEditedAt: data.lastEditedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('[NotepadService] Error getting note:', error);
      throw error;
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(noteId: string, title: string, content: string): Promise<void> {
    try {
      const notesCollection = await this.getNotesCollection();
      const now = new Date();

      await setDoc(
        doc(notesCollection, noteId),
        {
          title: title || 'Untitled Note',
          content,
          lastEditedAt: Timestamp.fromDate(now),
        },
        { merge: true }
      );

      console.log('[NotepadService] Note updated:', noteId);
    } catch (error) {
      console.error('[NotepadService] Error updating note:', error);
      throw error;
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<void> {
    try {
      const notesCollection = await this.getNotesCollection();
      await deleteDoc(doc(notesCollection, noteId));
      console.log('[NotepadService] Note deleted:', noteId);
    } catch (error) {
      console.error('[NotepadService] Error deleting note:', error);
      throw error;
    }
  }
}

