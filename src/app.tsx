import React, { useEffect, useState } from 'react';
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
type conditionalOptions = {
    text: string,
    variable: string,
    value: string
}
type componentData = {
    id: number,
    type: string,
    options: weatherOptions | imageOptions | conditionalOptions
}

/*
    Image Comp
*/
type ImageProps = {
    options: imageOptions
}
const Image = ({options}:ImageProps) => {
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
    temperature: 78
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
const Weather = ({options}:WeatherProps) => {
    const [wd, setWd] = useState<weatherData>()
    useEffect(()=>{
        axios.get(`${serverBaseUrl}/integration/weather?lat=${options.lat}&lon=${options.lon}`)
        .then((resp)=>{
            const weatherData: weatherData = resp.data.data;
            console.log(weatherData)
            setWd(weatherData)
        })
    },[])
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
                    {wd.upcomming.map((upData)=><div>
                        <img src={`/icons/${upData.condition}.svg`} />
                        <div>{upData.day}</div>
                    </div>)}
                </div>
            </div>
        </div>}
        </>
    )
}

const App = () => {
    const { id } = useParams<{ id: string }>();
    const [componentList, setComponentList] = useState<JSX.Element[]>([]);
    const [listData, setListData] = useState<any>();

    useEffect(()=>{
        console.log(classes)
        axios.get(`${serverBaseUrl}/page/${id}`)
        .then((resp)=>{
            const serveCompData: componentData[] = resp.data.data.components
            // create our components
            const newCompList = []
            for(const component of serveCompData) {
                let newComp: JSX.Element;
                if (component.type === "image") {
                    newComp = <Image key={component.id} options={(component.options as imageOptions)} />
                } else if (component.type === "weather") {
                    newComp = <Weather key={component.id} options={(component.options as weatherOptions)} />
                } else {
                    newComp = <div key={component.id}>{component.type}</div>
                }
                
                newCompList.push(newComp)
            }
            setComponentList(newCompList)
        })
    }, [id])

    return (
        <div className={classes.root}>
        {componentList}
        </div>
    );
};

export default App;
