import React, { FC } from "react"

import { List, ListItem, ListItemIcon, ListItemText } from "@material-ui/core"

import TrackListItem, { TrackListItemData } from "./TrackListItem"
import { Add } from "@material-ui/icons"
import { ListHeader } from "main/components/Drawer/Drawer"
import { useStores } from "main/hooks/useStores"
import { useObserver } from "mobx-react"
import {
  addTrack,
  removeTrack,
  selectTrack,
  toggleMuteTrack,
  toggleSoloTrack,
} from "main/actions"

export const TrackList: FC = () => {
  const { rootStore: stores } = useStores()
  const { router } = stores
  const { tracks } = useObserver(() => {
    const selectedTrackId = stores.song.selectedTrackId
    const trackMutes = stores.song.tracks.map((_, i) =>
      stores.trackMute.isMuted(i)
    )
    const trackSolos = stores.song.tracks.map((_, i) =>
      stores.trackMute.isSolo(i)
    )
    const tracks = stores.song.tracks
      .filter((t) => !t.isConductorTrack)
      .map(
        (t): TrackListItemData => {
          const index = stores.song.tracks.indexOf(t)
          const selected =
            !stores.rootViewStore.isArrangeViewSelected &&
            index === selectedTrackId
          return {
            index,
            name: t.displayName,
            instrument: t.instrumentName ?? "",
            mute: trackMutes[index],
            solo: trackSolos[index],
            selected,
            volume: t.volume ?? 0,
            pan: t.pan ?? 0,
          }
        }
      )
    return {
      tracks,
    }
  })

  const onClickMute = (trackId: number) => toggleMuteTrack(stores)(trackId)
  const onClickSolo = (trackId: number) => toggleSoloTrack(stores)(trackId)
  const onClickDelete = (trackId: number) => removeTrack(stores)(trackId)
  const onClickAddTrack = () => addTrack(stores)()
  // onChangeName={e => dispatch(SET_TRACK_NAME, { name: e.target.value })},
  const onSelectTrack = (trackId: number) => {
    router.pushTrack()
    selectTrack(stores)(trackId)
    stores.rootViewStore.openDrawer = false
  }
  const onClickArrangeView = () => {
    router.pushArrange()
  }

  const items = tracks.map((t) => (
    <TrackListItem
      key={t.index}
      {...t}
      onClick={() => onSelectTrack(t.index)}
      onClickSolo={() => onClickSolo(t.index)}
      onClickMute={() => onClickMute(t.index)}
      onClickDelete={() => onClickDelete(t.index)}
    />
  ))

  return (
    <List>
      <ListHeader onClick={onClickArrangeView}>Tracks</ListHeader>
      {items}
      <ListItem button onClick={onClickAddTrack}>
        <ListItemIcon>
          <Add />
        </ListItemIcon>
        <ListItemText primary="New track" />
      </ListItem>
    </List>
  )
}
