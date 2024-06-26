
filter.pids = [];

//metadata
filter.set_name("JSComp");
filter.set_desc("JS-based complex filter");
filter.set_version("0.1beta");
filter.set_author("GPAC team");
filter.set_help("This filter tests loading of sources and destinations from JS, mostly for test purposes of Javascript filter bindings");

//exposed arguments
filter.set_arg({name: "in", desc: "indicates source to load", type: GF_PROP_STRING} );
filter.set_arg({name: "out", desc: "indicates destination to write", type: GF_PROP_STRING} );
filter.set_arg({name: "f", desc: "indicates output filter", type: GF_PROP_STRING} );
filter.max_pids = -1;
//force demuxed inputs and outputs
filter.set_cap({id: "StreamType", value: "File", excluded: true} );
filter.set_cap({id: "StreamType", value: "File", output: true, excluded: true} );

filter.initialize = function() {
	if (!this.in) {
		print(GF_LOG_ERROR, "Missing input file name");
		return GF_BAD_PARAM;
	}
	if (!this.out && !this.f) {
		print(GF_LOG_ERROR, "Missing output file name");
		return GF_BAD_PARAM;
	}
	this.dummy = this.add_source("http://gpac.io/dummy");
	if (this.dummy) {
		this.dummy.on_setup_failure = function(e) {
			print(GF_LOG_ERROR, "Source setup failure " + e);
			filter.dummy=null;
			return true;
		}
	}
	this.src_f = this.add_source(this.in);
	if (this.src_f) {
		this.src_f.on_setup_failure = function(e) {
			print(GF_LOG_ERROR, "Source setup failure " + e);
			filter.src_f = null;
		}
		this.src_f.reset_source();
		//for coverage
		let fname = this.src_f.name;
	}
	if (this.out != null) {
			print(GF_LOG_ERROR, "output " + typeof this.out);
		this.dst_f = this.add_destination(this.out);
		this.dst_f.set_source(this);
	}
	if (this.f) {
		this.dst_f = this.add_filter(this.f);
		this.dst_f.set_source(this);
	}
}

filter.update_arg = function(name, val)
{
}

filter.configure_pid = function(pid)
{
	if (this.pids.indexOf(pid)<0) {
		print(GF_LOG_INFO, "Configure Pid " + typeof pid);
		evt = new FilterEvent(GF_FEVT_PLAY);
		pid.send_event(evt);
		this.pids.push(pid);
		pid.nb_pck = 0;
		pid.done_eos = false;

		pid.opid = this.new_pid();
		pid.opid.copy_props(pid);

	} else {
		print(GF_LOG_INFO, "Reconfigure Pid " + pid.name);		
	}
	this.src_f.get_arg('src');
	this.src_f.disable_probe();
	this.src_f.disable_inputs();
	pid.is_filter_in_parents(this.src_f);

}

filter.process = function()
{
	if (this.src_f.has_pid_connections_pending()) {
		return;
	}
	this.pids.forEach(function(pid) {
		while (1) {
			let pck = pid.get_packet();
			if (!pck) {
				if (pid.eos) {
					pid.opid.eos = true;
					filter.src_f.remove();
				}
				return;
			}
			pid.nb_pck++;	
			pid.opid.forward(pck);
			pid.drop_packet();
		}
	}
	);
}

filter.remove_pid = function(pid)
{
	let index = this.pids.indexOf(pid);
    if (index > -1) {
      this.pids.splice(index, 1);
   }
}

