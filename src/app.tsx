import React, { Children, useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router';

import classes from './app.module.css';

const serverBaseUrl = 'http://localhost:3030'

type weatherOptions = {
    lon: string,
    lat: string
}
type imageOptions = {
    src: string,
    alt: string
}
type buttonOptions = {
    text: string,
    variable: string,
    value: string
}
type conditionOptions = {
    variable: string,
    value: string
}
type componentData = {
    id: number,
    type: string,
    options: weatherOptions | imageOptions | buttonOptions | conditionOptions,
    children: number
}

/*
    Image Comp
*/
type ImageProps = {
    options: imageOptions
}
const Image = ({ options }: ImageProps) => {
    return (
        <div className={classes.imageCard}>
            <img src={options.src} alt={options.alt} />
        </div>
    )
}

/*
    Weather Comp
*/
type weatherData = {
    condition: string//"cloudy"
    conditionName: string//"Cloudy"
    lat: string//"-73.98563758004718"
    location: string//"New York, NY"
    lon: string//"40.748607102729295:"
    temperature: number//78
    unit: string//"f"
    upcomming: {
        day: string//"Fri"
        condition: string//"cloudy"
        conditionName: string//"Cloudy"
    }[]
}
type WeatherProps = {
    options: weatherOptions
}
const Weather = ({ options }: WeatherProps) => {
    const [wd, setWd] = useState<weatherData>()
    useEffect(() => {
        axios.get(`${serverBaseUrl}/integration/weather?lat=${options.lat}&lon=${options.lon}`)
            .then((resp) => {
                const weatherData: weatherData = resp.data.data;
                console.log(weatherData)
                setWd(weatherData)
            })
    }, [])
    return (
        <>
            {wd && <div className={classes.weatherCard}>
                <div className={classes.weatherLeft}>
                    <div><img src={`/icons/${wd.condition}.svg`} /></div>
                    <div>
                        <div>{wd.temperature}°{wd.unit}</div>
                        <div>{wd.conditionName}</div>
                    </div>
                </div>
                <div className={classes.weatherRight}>
                    <div>{wd.location}</div>
                    <div className={classes.weatherUpcoming}>
                        {wd.upcomming.map((upData) => <div key={upData.day}>
                            <img src={`/icons/${upData.condition}.svg`} />
                            <div>{upData.day}</div>
                        </div>)}
                    </div>
                </div>
            </div>}
        </>
    )
}

/*
    Button Comp
*/
type ButtonProps = {
    options: buttonOptions,
    setVariable: (a0: string, a1: string) => void
}
const Button = ({ options, setVariable }: ButtonProps) => {
    return (
        <div className={classes.imageCard} onClick={() => { setVariable(options.variable, options.value) }}>
            {options.text}
        </div>
    )
}

/*
    Condition Comp
*/
type ConditionProps = {
    options: conditionOptions
    children: JSX.Element,
    variableState?: string//Map<string, string>
}
const Condition = ({ options, children, variableState }: ConditionProps) => {
    const [display, setDisplay] = useState<boolean>(false)
    useEffect(() => {
        setDisplay(variableState === options.value)
    }, [variableState])
    return (
        <>{display && <div className={classes.imageCard}>
            {children}
        </div>}
        </>
    )
}

type listData = {
    id: number
    components: number[]
}
type variableData = {
    name:string
    initialValue: string
}
const App = () => {
    const { id } = useParams<{ id: string }>();
    const [variableData, setVariableData] = useState<{ [key: string]: string }>({})
    const [componentList, setComponentList] = useState<componentData[]>([]);
    const [listState, setListData] = useState<number[][]>();

    const setVariable = (variable: string, value: string) => {
        const newState = { ...variableData }
        newState[variable] = value
        setVariableData(newState)
    }

    useEffect(() => {
        console.log(classes)
        axios.get(`${serverBaseUrl}/page/${id}`)
            .then((resp) => {
                // set up variable data
                const varData:variableData[] = resp.data.data.variables
                const newVarState: {[key: string]: string } = {}
                for (const vars of varData) {
                    newVarState[vars.name] = vars.initialValue
                }
                setVariableData(newVarState)

                const serveCompData: componentData[] = resp.data.data.components
                setComponentList(serveCompData)

                // set up list state
                const listData: listData[] = resp.data.data.lists
                const newListState: number[][] = []
                for (const list of listData) {
                    const newList = []
                    for (const compId of list.components) {
                        newList.push(compId)//(newCompList[compId-1])
                    }
                    newListState.push(newList)
                }
                setListData(newListState)
            })
    }, [id])

    const getVarValue = (varName: string) => {
        return variableData[varName]
    }
    const getElements = (compIds: number[]) => {
        const res: React.ReactElement[] = []
        componentList.filter((compData) => compIds.includes(compData.id)).forEach((component) => {
            let newComp: JSX.Element;
            if (component.type === "image") {
                newComp = <Image key={component.id} options={(component.options as imageOptions)} />
            } else if (component.type === "weather") {
                newComp = <Weather key={component.id} options={(component.options as weatherOptions)} />
            } else if (component.type === "condition") {
                const ops = (component.options as conditionOptions)
                newComp = <Condition
                    key={component.id}
                    options={ops}
                    variableState={getVarValue(ops.variable)}
                >{<>{getElements(listState![component.children])}</>}</Condition>
            } else {
                newComp = <Button key={component.id} options={(component.options as buttonOptions)} setVariable={setVariable} />
            }
            res.push(newComp)
        })
        return res
    }

    return (
        <div className={classes.root}>
            {listState && getElements(listState[0])}
        </div>
    );
};

export default App;
