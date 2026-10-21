# Lubba Encoder

Encodes Lubba workouts from/to yaml, uint8 array and base64 hash.

Can be used to create workouts that the Lubba app can import.

## Workout notes

Workouts can include an optional `notes` string. JSON, YAML, and share hashes
preserve its Unicode text, newlines, and empty strings. Null or missing notes
are omitted.

Encoding version 1 stores notes as an optional trailing variable-length string
after the workout parts. Workouts without notes keep exactly the same bytes and
hashes. Updated decoders read old links; older decoders still read the workout
but ignore the notes trailer. Older decoders do not recognize the new
`workoutNotes` layout value (ID 72), so update consumers before sharing layouts
that use it.

## Map layouts

Version 1.1.19 adds the `map` layout value (ID 74). JSON, YAML and share hashes
preserve it in full-screen, split-grid and nested workout parts. Existing IDs,
including `workoutNotes` (72) and the `ve` target (73), are unchanged, so existing
links keep the same encoding. Update all consumers before sharing map layouts:
older decoders do not recognize ID 74. Map tiles and offline map packages are
transferred separately and are not included in workout share codes.

## Large top cell with three values below

Version 1.1.21 adds the `1L+3` workout layout (ID 14). It has four
`layoutValues`: the first occupies the large top cell, followed by the three
smaller cells in left-to-right order. Watchletic renders the top cell across
two row heights on Apple Watch and Wear OS. Any supported value, including
`map`, can occupy the large cell.

JSON, YAML and share hashes preserve this layout in nested workout parts.
Existing layout IDs and share encodings are unchanged. Update consumers to
1.1.21 or newer before sharing it: older decoders do not recognize layout ID 14.
