import { useTheme } from '@/contexts/ThemeContext';
import { Note, NotepadService } from '@/lib/notepadService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type NotepadPageProps = {
  onBack: () => void;
};

type ViewMode = 'list' | 'edit' | 'create';

export function NotepadPage({ onBack }: NotepadPageProps) {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const notepadService = NotepadService.getInstance();

  // Load all notes on mount
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const allNotes = await notepadService.getAllNotes();
      setNotes(allNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      Alert.alert('Error', 'Failed to load notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = () => {
    setCurrentNote(null);
    setNoteTitle('');
    setNoteContent('');
    setViewMode('create');
  };

  const handleEditNote = (note: Note) => {
    setCurrentNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setViewMode('edit');
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for your note.');
      return;
    }

    try {
      setSaving(true);

      if (viewMode === 'create') {
        // Create new note
        await notepadService.createNote(noteTitle.trim(), noteContent);
      } else if (viewMode === 'edit' && currentNote) {
        // Update existing note
        await notepadService.updateNote(currentNote.id, noteTitle.trim(), noteContent);
      }

      // Reload notes and go back to list
      await loadNotes();
      setViewMode('list');
      setCurrentNote(null);
      setNoteTitle('');
      setNoteContent('');
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert(
      'Delete Note',
      `Are you sure you want to delete "${note.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notepadService.deleteNote(note.id);
              await loadNotes();

              // If we're currently editing this note, go back to list
              if (currentNote?.id === note.id) {
                setViewMode('list');
                setCurrentNote(null);
              }
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleBack = () => {
    if (viewMode === 'list') {
      onBack();
    } else {
      // Ask to save if there are changes
      if (noteTitle.trim() || noteContent.trim()) {
        Alert.alert(
          'Unsaved Changes',
          'Do you want to save your changes?',
          [
            {
              text: 'Discard',
              style: 'destructive',
              onPress: () => {
                setViewMode('list');
                setCurrentNote(null);
                setNoteTitle('');
                setNoteContent('');
              },
            },
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Save',
              onPress: handleSaveNote,
            },
          ]
        );
      } else {
        setViewMode('list');
        setCurrentNote(null);
      }
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  // List View
  if (viewMode === 'list') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
          backgroundColor={colors.background}
        />
        
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notes</Text>
          <TouchableOpacity onPress={handleCreateNote} style={styles.actionButton}>
            <Ionicons name="add" size={28} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Notes List */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading notes...</Text>
            </View>
          ) : notes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Notes Yet</Text>
              <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                Create your first note by tapping the + button above
              </Text>
            </View>
          ) : (
            <View style={styles.notesList}>
              {notes.map((note) => (
                <TouchableOpacity
                  key={note.id}
                  style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleEditNote(note)}
                  activeOpacity={0.7}
                >
                  <View style={styles.noteCardHeader}>
                    <Text style={[styles.noteTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {note.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteNote(note)}
                      style={styles.deleteButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                  
                  {note.content ? (
                    <Text style={[styles.notePreview, { color: colors.textSecondary }]} numberOfLines={2}>
                      {note.content}
                    </Text>
                  ) : (
                    <Text style={[styles.notePreview, { color: colors.textSecondary, fontStyle: 'italic' }]}>
                      No content
                    </Text>
                  )}
                  
                  <View style={styles.noteMetadata}>
                    <Text style={[styles.metadataText, { color: colors.textSecondary }]}>
                      Edited {formatDate(note.lastEditedAt)}
                    </Text>
                    {note.createdAt.getTime() !== note.lastEditedAt.getTime() && (
                      <Text style={[styles.metadataText, { color: colors.textSecondary }]}>
                        • Created {formatDate(note.createdAt)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Edit/Create View
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {viewMode === 'create' ? 'New Note' : 'Edit Note'}
          </Text>
          <TouchableOpacity
            onPress={handleSaveNote}
            style={styles.actionButton}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="checkmark" size={28} color={colors.accent} />
            )}
          </TouchableOpacity>
        </View>

        {/* Edit Form */}
        <ScrollView style={styles.content} contentContainerStyle={styles.editContainer}>
          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Title</Text>
            <TextInput
              style={[styles.titleInput, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={noteTitle}
              onChangeText={setNoteTitle}
              placeholder="Enter note title..."
              placeholderTextColor={colors.textSecondary}
              maxLength={100}
            />
          </View>

          {/* Content Input */}
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Content</Text>
            <TextInput
              style={[styles.contentInput, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={noteContent}
              onChangeText={setNoteContent}
              placeholder="Start writing..."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Metadata (only for existing notes) */}
          {viewMode === 'edit' && currentNote && (
            <View style={styles.metadataContainer}>
              <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>
                Created: {currentNote.createdAt.toLocaleString()}
              </Text>
              <Text style={[styles.metadataLabel, { color: colors.textSecondary }]}>
                Last edited: {currentNote.lastEditedAt.toLocaleString()}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    width: 40,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  notesList: {
    gap: 12,
  },
  noteCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  notePreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  noteMetadata: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  metadataText: {
    fontSize: 12,
  },
  editContainer: {
    padding: 16,
    gap: 16,
    flexGrow: 1,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  titleInput: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  contentInput: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 200,
    flex: 1,
  },
  metadataContainer: {
    gap: 4,
    paddingTop: 8,
  },
  metadataLabel: {
    fontSize: 12,
  },
});

