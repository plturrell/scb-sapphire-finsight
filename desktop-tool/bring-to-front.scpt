tell application "System Events"
    set electronApps to (every process whose name contains "Electron")
    if (count of electronApps) > 0 then
        set frontmost of (item 1 of electronApps) to true
        return "FinSight brought to front"
    else
        return "FinSight app not found"
    end if
end tell