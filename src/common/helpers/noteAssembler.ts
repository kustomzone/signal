import { NoteOnEvent, NoteOffEvent } from "midifile-ts"
import { NoteEvent, TickProvider } from "common/track"
import { noteOnMidiEvent, noteOffMidiEvent } from "common/midi/MidiEvent"
import { Omit } from "recompose"
import _ from "lodash"

/**

  assemble noteOn and noteOff to single note event to append duration

 */
export function assemble<T>(
  events: (T | TickNoteOffEvent | TickNoteOnEvent)[]
): (T | NoteEvent)[] {
  const noteOnEvents: TickNoteOnEvent[] = []

  function findNoteOn(noteOff: TickNoteOffEvent): TickNoteOnEvent | null {
    const i = _.findIndex(noteOnEvents, e => {
      return e.noteNumber === noteOff.noteNumber
    })
    if (i < 0) {
      return null
    }
    const e = noteOnEvents[i]
    noteOnEvents.splice(i, 1)
    return e
  }

  const result: (T | NoteEvent)[] = []
  events.forEach(e => {
    if ("subtype" in e) {
      switch (e.subtype) {
        case "noteOn":
          noteOnEvents.push(e)
          break
        case "noteOff": {
          const noteOn = findNoteOn(e)
          if (noteOn != null) {
            const note: NoteEvent = {
              ...noteOn,
              subtype: "note",
              id: -1,
              tick: noteOn.tick,
              duration: e.tick - noteOn.tick
            }
            result.push(note)
          }
          break
        }
        default:
          result.push(e)
          break
      }
    } else {
      result.push(e)
    }
  })

  return result
}

export type TickNoteOnEvent = Omit<NoteOnEvent, "channel" | "deltaTime"> &
  TickProvider
export type TickNoteOffEvent = Omit<NoteOffEvent, "channel" | "deltaTime"> &
  TickProvider

// separate note to noteOn + noteOff
export function deassemble<T>(
  e: T | NoteEvent
): (T | TickNoteOnEvent | TickNoteOffEvent)[] {
  if ("subtype" in e && e.subtype === "note") {
    const noteOn = noteOnMidiEvent(0, -1, e.noteNumber, e.velocity)
    const noteOff = noteOffMidiEvent(0, -1, e.noteNumber)
    return [
      { ...noteOn, tick: e.tick },
      { ...noteOff, tick: e.tick + e.duration - 1 } // -1 to prevent overlap
    ]
  } else {
    return [e as T]
  }
}