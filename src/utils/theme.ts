import Color from 'color'

function toRgbString(color : Color) : string {
    color = new Color(color)
    return `${color.red()}, ${color.green()}, ${color.blue()}`
}

export class Theme {
    backgroundColor: string
    backgroundColorRgb: string
    foregroundColor: string
    foregroundColorRgb: string
    themeColor: string
    themeColorRgb: string

    constructor(backgroundColor, foregroundColor, themeColor) {
        this.backgroundColor = backgroundColor
        this.backgroundColorRgb = toRgbString(backgroundColor)
        this.foregroundColor = foregroundColor
        this.foregroundColorRgb = toRgbString(foregroundColor)
        this.themeColor = themeColor
        this.themeColorRgb = toRgbString(themeColor)
    }
}

export const DefaultBrightTheme = new Theme('white', 'black', '#e9266a')
export const DefaultDarkTheme = new Theme('#000628', 'white', '#e9266a')