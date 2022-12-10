import { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';

import { icons } from '../../utils/icons';
import * as actions from '../../store/actions';
import { getInfoSong } from '../../services/music';
import { BASE_URL } from '../../utils/constant';

const {
    BsFillPlayFill,
    CiShuffle,
    BsPauseFill,
    MdSkipNext,
    MdSkipPrevious,
    CiRepeat,
    BsMusicNoteList,
    SlVolume1,
    SlVolume2,
    SlVolumeOff,
    RiRepeatOneLine
} = icons;

function Player({ setIsShowSidebar }) {
    const { curSongId, isPlaying } = useSelector((state) => state.music);
    const { token } = useSelector((state) => state.auth);
    const [volume, setVolume] = useState(100);
    const [songInfo, setSongInfo] = useState({});
    const [imageSong, setImageSong] = useState('')
    const audio = useRef();
    const [currentSecond, setCurrentSecond] = useState(0);
    const [isShuffle, setIsShuffle] = useState(false)
    const [isRepeat, setIsRepeat] = useState(0)
    const dispatch = useDispatch();
    const trackRef = useRef();
    const thumbRef = useRef();
    // TODOS

    useEffect(() => {
        const fetchSong = async () => {
            audio.current.src = BASE_URL + `/api/song/getMedia?id=${curSongId}`;    
        };
        fetchSong();
        const fetchInfoSong =  async () => {
            const response = await getInfoSong(curSongId, token)
            setSongInfo(response.data)
        }
        
        fetchInfoSong()
        const fetchImageSong = async () => {
            setImageSong(`${BASE_URL}/api/song/getCover?id=${curSongId}`)
        }
        fetchImageSong()

    }, [curSongId]);
    var intervalId;
    useEffect(() => {
        intervalId && clearInterval(intervalId);

        if (isPlaying && thumbRef.current) {
            audio.current.pause();
            audio.current.play();
            intervalId = setInterval(() => {
                setCurrentSecond(audio.current.currentTime);
                let percent = Math.round((audio.current.currentTime * 10000) / songInfo.duration) / 100;
                thumbRef.current.style.cssText = `right:${100 - percent}%`;
            }, 200);
        }
        return () => {
            intervalId && clearInterval(intervalId);
        };
    }, [audio.current?.src, isPlaying]);
    const handleToggleMusic = () => {
        if (isPlaying) {
            audio.current.pause();
            dispatch(actions.play(false));
        } else {
            audio.current.play();
            dispatch(actions.play(true));
        }
    };
    useEffect(() => {
        audio.current.volume = volume / 100;
    }, [volume]);
    const handleRepeatOnce = () => {
        audio.current.play()
    }
    // const handleShuffle = () => {
    //     const randomIndex = Math.round(Math.random() * songs?.length) - 1;
    //     dispatch(actions.setCurSongId(songs[randomIndex].id));
    //     dispatch(actions.play(true));
    // };
    useEffect(() => {
        console.log(isRepeat)

        const handleEnd = () => {

            if(isRepeat == 2) {
                handleRepeatOnce()
            } else {
                audio.current.pause();
                dispatch(actions.play(false));
            }
            if(isShuffle) {
                // handleShuffle()
            }

        };
        audio.current.addEventListener('ended', handleEnd);
        return () => {
            audio.current && audio.current.removeEventListener('ended', handleEnd);
        };
    }, [audio, isRepeat]);
    const handleClickProgressbar = (e) => {
        const trackkRect = trackRef.current.getBoundingClientRect();
        const percent = Math.round(((e.clientX - trackkRect.left) * 10000) / trackkRect.width) / 100;
        audio.current.currentTime = (percent * songInfo.duration) / 100;
        thumbRef.current.style.cssText = `right: ${100 - percent}%`;
        setCurrentSecond(audio.current.currentTime);
    };
    const handleNextSong = (e) => {

    }
    const handlePrevSong = (e) => {
        
    }
    return (
        <div className="flex items-center h-full text-white">
            {/* //Songdetai */}
            <div className="flex w-[30%] items-center gap-4 ">
                <img
                    className={`h-[60px] w-[60px] object-cover ${
                        isPlaying ? 'animate-rotate-center rounded-full ' : ''
                    }`}
                    src={imageSong}
                />
                <div>
                    <h3 className="text-sm">{songInfo?.name}</h3>
                    <span className="text-xs opacity-70">{`uploaded by ${songInfo?.uploader}`}</span>
                </div>
            </div>

            <div className="flex w-[40%] flex-col items-center justify-center gap-2 ">
                {/* //Main Player */}
                <div className="flex items-center justify-center gap-8">
                    <span onClick={() =>setIsShuffle(prev => !prev)} className={`${isShuffle && 'text-activecolor'} cursor-pointer`}>
                        <CiShuffle size={24} />
                    </span>
                    <span onClick={handlePrevSong} className="cursor-pointer text-gray-600 pointer-events-none">
                        <MdSkipPrevious size={24} />
                    </span>
                    <span onClick={handleToggleMusic} className="cursor-pointer rounded-full border border-white p-1">
                        {!isPlaying ? (
                            <BsFillPlayFill size={24} className="mr-[-1px]" />
                        ) : (
                            <BsPauseFill size={24} className="mr-[-1px]" />
                        )}
                    </span>
                    <span onClick={handleNextSong} className="cursor-pointer text-gray-600 pointer-events-none">
                        <MdSkipNext size={24} />
                    </span>
                    <span onClick={() => setIsRepeat(prev => (prev == 2 ? 0 : (prev + 1)))} className={`cursor-pointer ${isRepeat > 0 && 'text-activecolor'}`}>
                        {isRepeat == 2 ? <RiRepeatOneLine size={24}/> : <CiRepeat  size={24} />}
                    </span>
                    <audio ref={audio}> </audio>
                </div>
                <div className="flex w-full items-center justify-center gap-2 text-sm">
                    <span>{moment.utc(currentSecond * 1000).format('mm:ss')}</span>
                    <div
                        onClick={handleClickProgressbar}
                        ref={trackRef}
                        className="relative h-[3px] w-3/4 cursor-pointer rounded-r-full rounded-l-full bg-[#fff] hover:h-[6px]"
                    >
                        <div
                            ref={thumbRef}
                            className="absolute top-0 left-0 bottom-0 rounded-r-full rounded-l-full bg-activecolor"
                        ></div>
                    </div>
                    <span>{moment.utc((songInfo?.duration || 0) * 1000).format('mm:ss')}</span>
                </div>
            </div>

            <div className="flex w-[30%] items-center justify-end gap-2 p-2">
                <span
                    className="cursor-pointer"
                    onClick={() =>
                        setVolume((prev) => {
                            if (prev == 0) {
                                setVolume(100);
                            } else {
                                setVolume(0);
                            }
                        })
                    }
                >
                    {' '}
                    {volume > 70 ? <SlVolume2 /> : volume == 0 ? <SlVolumeOff /> : <SlVolume1 />}{' '}
                </span>
                <input
                    className="cursor-pointer font"
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                />
                <span className="cursor-pointer" onClick={() => setIsShowSidebar((prev) => !prev)}>
                    <BsMusicNoteList />
                </span>
            </div>
        </div>
    );
}

export default Player;
