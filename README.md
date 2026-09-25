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
